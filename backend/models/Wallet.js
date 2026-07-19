const mongoose = require('mongoose');

// Un wallet interne par utilisateur et par actif (ex: USDT).
// depositAddress = adresse de dépôt on-chain unique dérivée pour cet utilisateur.
const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  asset: { type: String, required: true, default: 'USDT' },
  network: { type: String, enum: ['BSC', 'TRON'], default: 'BSC' },
  depositAddress: { type: String, required: true, unique: true },
  derivationIndex: { type: Number, required: true }, // index HD wallet — voir utils/hdWallet.js
  available: { type: Number, default: 0 },   // solde disponible
  locked: { type: Number, default: 0 }       // solde bloqué en escrow
}, { timestamps: true });

walletSchema.index({ user: 1, asset: 1 }, { unique: true });

module.exports = mongoose.model('Wallet', walletSchema);
