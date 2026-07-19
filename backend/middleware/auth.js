const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentification requise' });

    const payload = verifyToken(token);
    const user = await User.findById(payload.id);
    if (!user || user.status !== 'actif') {
      return res.status(401).json({ message: 'Compte introuvable ou suspendu' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
