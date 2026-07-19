const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../utils/jwt');

async function register(req, res, next) {
  try {
    const { email, password, fullName, phone } = req.body;
    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Un compte existe déjà avec cet email' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash, fullName, phone });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, fullName: user.fullName, kycStatus: user.kyc.status }
    });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Identifiants invalides' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Identifiants invalides' });

    if (user.twoFactor.enabled) {
      // le frontend doit ensuite appeler /api/auth/2fa/verify avec le code TOTP
      return res.json({ requires2FA: true, userId: user._id });
    }

    const token = signToken(user);
    res.json({ token, user: { id: user._id, email: user.email, fullName: user.fullName } });
  } catch (err) { next(err); }
}

async function me(req, res) {
  const u = req.user;
  res.json({
    id: u._id, email: u.email, fullName: u.fullName, phone: u.phone,
    kyc: u.kyc, twoFactorEnabled: u.twoFactor.enabled, reputation: u.reputation, role: u.role
  });
}

module.exports = { register, login, me };
