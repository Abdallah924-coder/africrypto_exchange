const Listing = require('../models/Listing');
const P2PTransaction = require('../models/P2PTransaction');
const Message = require('../models/Message');
const Dispute = require('../models/Dispute');
const { getOrCreateWallet } = require('./wallet.controller');

const FEE_PERCENT = () => Number(process.env.PLATFORM_FEE_PERCENT || 0.5);
const PAYMENT_WINDOW_MINUTES = 15;

// --- Annonces ---

async function createListing(req, res, next) {
  try {
    const { pricePerUnit, minLimit, maxLimit, availableAmount, paymentMethods } = req.body;
    const wallet = await getOrCreateWallet(req.user._id);

    if (wallet.available < availableAmount) {
      return res.status(400).json({ message: "Solde disponible insuffisant pour cette annonce" });
    }

    const listing = await Listing.create({
      seller: req.user._id, pricePerUnit, minLimit, maxLimit,
      availableAmount, paymentMethods
    });
    res.status(201).json(listing);
  } catch (err) { next(err); }
}

async function getListings(req, res, next) {
  try {
    const { paymentMethod, minAmount } = req.query;
    const filter = { status: 'active' };
    if (paymentMethod) filter.paymentMethods = paymentMethod;
    if (minAmount) filter.availableAmount = { $gte: Number(minAmount) };

    const listings = await Listing.find(filter)
      .populate('seller', 'fullName reputation')
      .sort({ pricePerUnit: 1 });
    res.json(listings);
  } catch (err) { next(err); }
}

// --- Achat : ouverture de la transaction + blocage en escrow ---

async function buy(req, res, next) {
  try {
    const { listingId, amountCrypto, paymentMethod } = req.body;
    const listing = await Listing.findById(listingId);
    if (!listing || listing.status !== 'active') {
      return res.status(404).json({ message: 'Annonce introuvable ou inactive' });
    }
    if (String(listing.seller) === String(req.user._id)) {
      return res.status(400).json({ message: 'Vous ne pouvez pas acheter votre propre annonce' });
    }
    const amountFiat = amountCrypto * listing.pricePerUnit;
    if (amountFiat < listing.minLimit || amountFiat > listing.maxLimit) {
      return res.status(400).json({ message: 'Montant hors des limites de l\'annonce' });
    }
    if (amountCrypto > listing.availableAmount) {
      return res.status(400).json({ message: 'Quantité indisponible' });
    }

    const sellerWallet = await getOrCreateWallet(listing.seller);
    const fee = amountCrypto * (FEE_PERCENT() / 100);

    if (sellerWallet.available < amountCrypto) {
      return res.status(400).json({ message: 'Le vendeur n\'a plus assez de solde disponible' });
    }

    // Blocage en escrow : les fonds sortent de "available" et entrent dans "locked".
    // Ils restent la propriété du vendeur tant que la transaction n'est pas confirmée.
    sellerWallet.available -= amountCrypto;
    sellerWallet.locked += amountCrypto;
    await sellerWallet.save();

    listing.availableAmount -= amountCrypto;
    if (listing.availableAmount <= 0) listing.status = 'epuisee';
    await listing.save();

    const transaction = await P2PTransaction.create({
      listing: listing._id,
      seller: listing.seller,
      buyer: req.user._id,
      amountCrypto, amountFiat,
      pricePerUnit: listing.pricePerUnit,
      platformFee: fee,
      paymentMethod,
      expiresAt: new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000)
    });

    const io = req.app.get('io');
    io.to(`user:${listing.seller}`).emit('p2p:new_transaction', { transactionId: transaction._id });

    res.status(201).json(transaction);
  } catch (err) { next(err); }
}

// --- Acheteur déclare avoir payé (hors plateforme, Mobile Money) ---

async function declarePaid(req, res, next) {
  try {
    const tx = await P2PTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction introuvable' });
    if (String(tx.buyer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Seul l\'acheteur peut déclarer le paiement' });
    }
    if (tx.status !== 'en_attente_paiement') {
      return res.status(400).json({ message: 'Transaction déjà traitée' });
    }

    tx.status = 'paiement_declare';
    tx.paymentDeclaredAt = new Date();
    await tx.save();

    req.app.get('io').to(`user:${tx.seller}`).emit('p2p:payment_declared', { transactionId: tx._id });
    res.json(tx);
  } catch (err) { next(err); }
}

// --- Vendeur confirme réception du paiement -> libération de l'escrow ---

async function confirmRelease(req, res, next) {
  try {
    const tx = await P2PTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction introuvable' });
    if (String(tx.seller) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Seul le vendeur peut confirmer' });
    }
    if (!['paiement_declare', 'litige'].includes(tx.status)) {
      return res.status(400).json({ message: 'La transaction n\'est pas prête à être libérée' });
    }

    const sellerWallet = await getOrCreateWallet(tx.seller);
    const buyerWallet = await getOrCreateWallet(tx.buyer);

    const net = tx.amountCrypto - tx.platformFee;
    sellerWallet.locked -= tx.amountCrypto;
    buyerWallet.available += net;
    // tx.platformFee reste hors des deux wallets : c'est la commission de la plateforme.
    await sellerWallet.save();
    await buyerWallet.save();

    tx.status = 'liberee';
    tx.releasedAt = new Date();
    await tx.save();

    req.app.get('io').to(`user:${tx.buyer}`).emit('p2p:released', { transactionId: tx._id });
    res.json(tx);
  } catch (err) { next(err); }
}

// --- Litige ---

async function openDispute(req, res, next) {
  try {
    const { reason, evidenceUrls } = req.body;
    const tx = await P2PTransaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ message: 'Transaction introuvable' });

    const isParty = [String(tx.seller), String(tx.buyer)].includes(String(req.user._id));
    if (!isParty) return res.status(403).json({ message: 'Non autorisé' });

    tx.status = 'litige';
    tx.disputeReason = reason;
    await tx.save();

    const dispute = await Dispute.create({
      transaction: tx._id, openedBy: req.user._id, reason, evidenceUrls
    });
    res.status(201).json(dispute);
  } catch (err) { next(err); }
}

// --- Chat ---

async function getMessages(req, res, next) {
  try {
    const messages = await Message.find({ transaction: req.params.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) { next(err); }
}

module.exports = {
  createListing, getListings, buy, declarePaid, confirmRelease, openDispute, getMessages
};
