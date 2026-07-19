const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['vente'], default: 'vente' }, // le vendeur poste l'annonce ; l'acheteur clique "Acheter"
  asset: { type: String, default: 'USDT' },
  fiatCurrency: { type: String, default: 'XAF' },
  pricePerUnit: { type: Number, required: true },
  minLimit: { type: Number, required: true },
  maxLimit: { type: Number, required: true },
  availableAmount: { type: Number, required: true }, // quantité totale proposée à la vente
  paymentMethods: [{ type: String }], // ex: ['Orange Money', 'MTN Mobile Money']
  status: { type: String, enum: ['active', 'suspendue', 'epuisee'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
