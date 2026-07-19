const Wallet = require('../models/Wallet');
const User = require('../models/User');
const { deriveDepositAddress } = require('../utils/hdWallet');

async function getOrCreateWallet(userId, asset = 'USDT', network = 'BSC') {
  let wallet = await Wallet.findOne({ user: userId, asset });
  if (wallet) return wallet;

  const count = await Wallet.countDocuments();
  const { address, derivationIndex } = deriveDepositAddress(count + 1);

  wallet = await Wallet.create({
    user: userId, asset, network,
    depositAddress: address, derivationIndex
  });
  return wallet;
}

async function getMyWallet(req, res, next) {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    res.json(wallet);
  } catch (err) { next(err); }
}

// Appelé par le service de monitoring blockchain (webhook Moralis/QuickNode)
// quand un dépôt est détecté sur une adresse suivie.
// TODO: sécuriser avec une signature de webhook + vérification du nombre de confirmations.
async function depositWebhook(req, res, next) {
  try {
    const { address, amount, txHash } = req.body;
    const wallet = await Wallet.findOne({ depositAddress: address });
    if (!wallet) return res.status(404).json({ message: 'Adresse inconnue' });

    wallet.available += Number(amount);
    await wallet.save();

    const io = req.app.get('io');
    io.to(`user:${wallet.user}`).emit('deposit:credited', { asset: wallet.asset, amount, txHash });

    res.json({ received: true });
  } catch (err) { next(err); }
}

async function withdraw(req, res, next) {
  try {
    const { toAddress, amount } = req.body;
    const wallet = await getOrCreateWallet(req.user._id);
    const feePercent = Number(process.env.WITHDRAWAL_FEE_PERCENT || 1);
    const fee = Math.max(amount * (feePercent / 100), 1);
    const total = Number(amount) + fee;

    if (wallet.available < total) {
      return res.status(400).json({ message: 'Solde disponible insuffisant' });
    }

    wallet.available -= total;
    await wallet.save();

    // TODO: brancher l'envoi on-chain réel (ethers.js signé côté service de signature / KMS)
    // puis mettre à jour le statut de la transaction (pending -> confirmé) via webhook.

    res.json({
      status: 'pending',
      toAddress, amount, fee,
      message: 'Retrait initié, en cours de confirmation sur la blockchain'
    });
  } catch (err) { next(err); }
}

module.exports = { getMyWallet, depositWebhook, withdraw, getOrCreateWallet };
