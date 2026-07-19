const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  kyc: {
    idDocumentUrl: { type: String },
    status: { type: String, enum: ['non_soumis', 'en_attente', 'valide', 'rejete'], default: 'non_soumis' }
  },
  twoFactor: {
    enabled: { type: Boolean, default: false },
    secret: { type: String }
  },
  role: { type: String, enum: ['utilisateur', 'admin'], default: 'utilisateur' },
  reputation: {
    ordersCompleted: { type: Number, default: 0 },
    positiveRate: { type: Number, default: 100 }
  },
  status: { type: String, enum: ['actif', 'suspendu'], default: 'actif' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
