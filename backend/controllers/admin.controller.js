const Dispute = require('../models/Dispute');
const P2PTransaction = require('../models/P2PTransaction');
const User = require('../models/User');
const { getOrCreateWallet } = require('./wallet.controller');

async function listDisputes(req, res, next) {
  try {
    const disputes = await Dispute.find({ status: 'ouvert' })
      .populate('transaction')
      .populate('openedBy', 'fullName email');
    res.json(disputes);
  } catch (err) { next(err); }
}

// L'admin tranche : les fonds en escrow vont soit à l'acheteur, soit reviennent au vendeur.
async function resolveDispute(req, res, next) {
  try {
    const { resolution } = req.body; // 'en_faveur_acheteur' | 'en_faveur_vendeur'
    const dispute = await Dispute.findById(req.params.id).populate('transaction');
    if (!dispute) return res.status(404).json({ message: 'Litige introuvable' });

    const tx = dispute.transaction;
    const sellerWallet = await getOrCreateWallet(tx.seller);
    const buyerWallet = await getOrCreateWallet(tx.buyer);

    if (resolution === 'en_faveur_acheteur') {
      const net = tx.amountCrypto - tx.platformFee;
      sellerWallet.locked -= tx.amountCrypto;
      buyerWallet.available += net;
      tx.status = 'liberee';
      tx.releasedAt = new Date();
    } else {
      sellerWallet.locked -= tx.amountCrypto;
      sellerWallet.available += tx.amountCrypto; // remboursé intégralement, pas de commission
      tx.status = 'remboursee';
    }

    await sellerWallet.save();
    await buyerWallet.save();
    await tx.save();

    dispute.status = 'resolu';
    dispute.resolution = resolution;
    dispute.resolvedBy = req.user._id;
    dispute.resolvedAt = new Date();
    await dispute.save();

    res.json({ dispute, transaction: tx });
  } catch (err) { next(err); }
}

async function listUsers(req, res, next) {
  try {
    const users = await User.find().select('-passwordHash -twoFactor.secret').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) { next(err); }
}

async function suspendUser(req, res, next) {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id, { status: 'suspendu' }, { new: true }
    ).select('-passwordHash');
    res.json(user);
  } catch (err) { next(err); }
}

module.exports = { listDisputes, resolveDispute, listUsers, suspendUser };
