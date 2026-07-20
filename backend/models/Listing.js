const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['vente'], default: 'vente' },
  asset: { type: String, default: 'USDT' },
  fiatCurrency: { type: String, default: 'XAF' },
  pricePerUnit: { type: Number, required: true },
  minLimit: { type: Number, required: true },
  maxLimit: { type: Number, required: true },
  availableAmount: { type: Number, required: true },
  paymentDetails: [{
    method: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true }
  }],
  status: { type: String, enum: ['active', 'suspendue', 'epuisee'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);