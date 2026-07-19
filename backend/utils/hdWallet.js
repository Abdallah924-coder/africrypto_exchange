// Génération d'adresses de dépôt par dérivation HD wallet (BIP-44).
//
// ⚠️ Ceci est un squelette. En production :
// - la clé mère (mnemonic/xpriv) ne doit JAMAIS vivre dans le code ou une variable
//   d'env en clair : utiliser un KMS/HSM (AWS KMS, GCP KMS, Fireblocks, Cobo WaaS...)
// - seule la clé PUBLIQUE étendue (xpub) est nécessaire pour dériver des adresses
//   de dépôt ; la clé privée ne doit être accessible qu'au service de signature des retraits.
// - chaque utilisateur reçoit un index de dérivation unique et croissant.
//
// Ici on simule la dérivation pour que le reste du système (wallet, escrow, retraits)
// soit déjà branché sur la bonne interface.

const { ethers } = require('ethers'); // npm install ethers si non présent

function deriveDepositAddress(index) {
  // TODO remplacer par une dérivation réelle à partir du xpub du WaaS/HSM
  // ex: HDNode.derivePath(`m/44'/60'/0'/0/${index}`)
  const wallet = ethers.Wallet.createRandom(); // placeholder déterministe à remplacer
  return { address: wallet.address, derivationIndex: index };
}

module.exports = { deriveDepositAddress };
