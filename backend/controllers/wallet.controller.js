const Wallet = require('../models/Wallet');
const WalletMovement = require('../models/WalletMovement');
const signerClient = require('../services/signerClient');

async function getOrCreateWallet(userId, asset = 'USDT', network = 'BSC') {
  let wallet = await Wallet.findOne({ user: userId, asset });
  if (wallet) return wallet;
  const count = await Wallet.countDocuments();
  const derivationIndex = count + 1;
  const { address } = await signerClient.derive(derivationIndex);
  wallet = await Wallet.create({ user: userId, asset, network, depositAddress: address, derivationIndex });
  return wallet;
}

async function getMyWallet(req, res, next) {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    res.json(wallet);
  } catch (err) { next(err); }
}

async function withdraw(req, res, next) {
  try {
    const { toAddress, amount } = req.body;
    const wallet = await getOrCreateWallet(req.user._id);
    const feePercent = Number(process.env.WITHDRAWAL_FEE_PERCENT || 1);
    const fee = Math.max(amount * (feePercent / 100), 1);
    const total = Number(amount) + fee;
    if (wallet.available < total) return res.status(400).json({ message: 'Solde disponible insuffisant' });
    wallet.available -= total;
    await wallet.save();
    try {
      const result = await signerClient.withdraw(toAddress, amount);
      await WalletMovement.create({ user: req.user._id, type: 'retrait', amount, fee, toAddress, txHash: result.txHash, status: 'confirme' });
      res.json({ status: result.status, txHash: result.txHash, toAddress, amount, fee });
    } catch (signErr) {
      wallet.available += total;
      await wallet.save();
      throw signErr;
    }
  } catch (err) { next(err); }
}

async function getMovements(req, res, next) {
  try {
    const movements = await WalletMovement.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(movements);
  } catch (err) { next(err); }
}

module.exports = { getMyWallet, withdraw, getMovements, getOrCreateWallet };