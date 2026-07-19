const mongoose = require('mongoose');

const p2pTransactionSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  asset: { type: String, default: 'USDT' },
  fiatCurrency: { type: String, default: 'XAF' },
  amountCrypto: { type: Number, required: true },
  amountFiat: { type: Number, required: true },
  pricePerUnit: { type: Number, required: true },
  platformFee: { type: Number, required: true }, // prélevé sur le vendeur, en actif crypto
  paymentMethod: { type: String, required: true },
  // machine à états de l'escrow :
  // en_attente_paiement -> paiement_declare -> liberee (succès)
  //                                          -> litige -> liberee | remboursee
  status: {
    type: String,
    enum: ['en_attente_paiement', 'paiement_declare', 'liberee', 'litige', 'remboursee', 'annulee'],
    default: 'en_attente_paiement'
  },
  paymentDeclaredAt: { type: Date },
  releasedAt: { type: Date },
  disputeReason: { type: String },
  expiresAt: { type: Date, required: true } // délai pour payer (ex: 15 min)
}, { timestamps: true });

module.exports = mongoose.model('P2PTransaction', p2pTransactionSchema);
