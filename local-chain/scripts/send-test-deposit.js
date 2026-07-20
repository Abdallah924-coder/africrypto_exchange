// Simule un dépôt : envoie du mUSDT depuis le compte déployeur (déjà crédité)
// vers l'adresse de dépôt générée par ta plateforme, pour tester le depositMonitor.
//
// Usage : npx hardhat run scripts/send-test-deposit.js --network localhost
// (modifier DEPOSIT_ADDRESS et AMOUNT ci-dessous avant de lancer)

const hre = require('hardhat');

const DEPOSIT_ADDRESS = '0xe1A18819AAC588b01e430E769D7042261054505C'; // depuis wallet.html
const AMOUNT = '50'; // en mUSDT
const USDT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // affichée par deploy.js

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const token = await hre.ethers.getContractAt('MockUSDT', USDT_CONTRACT_ADDRESS, deployer);

  const balanceBefore = await token.balanceOf(DEPOSIT_ADDRESS);
  const tx = await token.transfer(DEPOSIT_ADDRESS, hre.ethers.parseUnits(AMOUNT, 18));
  await tx.wait();
  const balanceAfter = await token.balanceOf(DEPOSIT_ADDRESS);

  console.log(`Envoyé : ${AMOUNT} mUSDT`);
  console.log(`Solde on-chain de l'adresse de dépôt : ${hre.ethers.formatUnits(balanceBefore, 18)} → ${hre.ethers.formatUnits(balanceAfter, 18)}`);
  console.log('\nMaintenant : attends jusqu\'à DEPOSIT_POLL_INTERVAL_MS (30s par défaut),');
  console.log('puis rafraîchis dashboard.html/wallet.html — le solde disponible doit avoir bougé automatiquement.');
}

main().catch((err) => { console.error(err); process.exitCode = 1; });