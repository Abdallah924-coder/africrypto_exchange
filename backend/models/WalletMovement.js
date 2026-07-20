const mongoose = require('mongoose');

const walletMovementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['depot', 'retrait'], required: true },
  asset: { type: String, default: 'USDT' },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  toAddress: { type: String },
  txHash: { type: String },
  status: { type: String, enum: ['confirme', 'en_attente', 'echoue'], default: 'confirme' }
}, { timestamps: true });

module.exports = mongoose.model('WalletMovement', walletMovementSchema);