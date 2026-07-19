const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'P2PTransaction', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  attachmentUrl: { type: String }, // ex: capture d'écran de preuve de paiement
  readAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
