// Dérivation HD wallet réelle (BIP-44) — remplace le stub aléatoire précédent.
// Chaque utilisateur = un index croissant = une adresse de dépôt déterministe,
// reproductible à partir de la seule mnémonique (donc récupérable en cas de perte de la DB).
const { ethers } = require('ethers');
require('dotenv').config();

if (!process.env.DEPOSIT_MNEMONIC || process.env.DEPOSIT_MNEMONIC.startsWith('replace_with')) {
  throw new Error(
    'DEPOSIT_MNEMONIC non configurée. Générer une mnémonique hors-ligne (voir README) ' +
    'avant de démarrer ce service — ne jamais utiliser la valeur par défaut.'
  );
}

const rootNode = ethers.HDNodeWallet.fromPhrase(process.env.DEPOSIT_MNEMONIC);

// Chemin BIP-44 standard EVM : m/44'/60'/0'/0/{index}
function deriveDepositWallet(index) {
  const child = rootNode.derivePath(`44'/60'/0'/0/${index}`);
  return { address: child.address, privateKey: child.privateKey, derivationIndex: index };
}

module.exports = { deriveDepositWallet };