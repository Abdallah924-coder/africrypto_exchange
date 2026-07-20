// Crée ou met à jour automatiquement le compte admin à partir de ADMIN_EMAIL /
// ADMIN_PASSWORD dans .env — aucune manipulation manuelle en base nécessaire.
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('[admin-seed] ADMIN_EMAIL / ADMIN_PASSWORD non définis — aucun admin créé.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $set: { passwordHash, role: 'admin', status: 'actif' },
      $setOnInsert: { fullName: 'Administrateur', phone: 'N/A', email: email.toLowerCase() }
    },
    { upsert: true, new: true }
  );
  console.log(`[admin-seed] Compte admin prêt : ${admin.email}`);
}

module.exports = { seedAdmin };