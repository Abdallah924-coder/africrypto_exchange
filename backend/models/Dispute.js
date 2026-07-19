const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'P2PTransaction', required: true },
  openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  evidenceUrls: [{ type: String }],
  status: { type: String, enum: ['ouvert', 'resolu'], default: 'ouvert' },
  resolution: { type: String, enum: ['en_faveur_acheteur', 'en_faveur_vendeur'] },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
