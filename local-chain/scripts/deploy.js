// Déploie MockUSDT sur la chaîne locale et affiche tout ce qu'il faut coller dans les .env.
const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const MockUSDT = await hre.ethers.getContractFactory('MockUSDT');
  const token = await MockUSDT.deploy();
  await token.waitForDeployment();

  // Frappe 1 000 000 mUSDT pour pouvoir tester largement.
  const mintTx = await token.mint(hre.ethers.parseUnits('1000000', 18));
  await mintTx.wait();

  console.log('\n=== À coller dans backend/.env ET signer-service/.env ===');
  console.log('RPC_URL=http://127.0.0.1:8545');
  console.log('CHAIN_ID=31337');
  console.log(`USDT_CONTRACT_ADDRESS=${await token.getAddress()}`);
  console.log(`\nCompte déployeur (déjà crédité de 1 000 000 mUSDT) : ${deployer.address}`);
  console.log('\n=== Comptes pré-financés disponibles (10000 ETH-fictif chacun) ===');
  console.log('Utilise `npx hardhat node` pour voir la liste complète avec leurs clés privées.');
}

main().catch((err) => { console.error(err); process.exitCode = 1; });