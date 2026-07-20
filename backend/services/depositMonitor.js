const { ethers } = require('ethers');
const Wallet = require('../models/Wallet');
const WalletMovement = require('../models/WalletMovement');
const signerClient = require('./signerClient');

function assertConfig() {
  const required = ['RPC_URL', 'USDT_CONTRACT_ADDRESS', 'HOT_WALLET_ADDRESS'];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`[deposit-monitor] Variable manquante dans backend/.env : ${key}`);
  }
  if (!ethers.isAddress(process.env.USDT_CONTRACT_ADDRESS)) {
    throw new Error(`[deposit-monitor] USDT_CONTRACT_ADDRESS invalide dans backend/.env : "${process.env.USDT_CONTRACT_ADDRESS}"`);
  }
}
assertConfig();

const ERC20_ABI = ['function balanceOf(address owner) view returns (uint256)', 'function decimals() view returns (uint8)'];
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const usdt = new ethers.Contract(process.env.USDT_CONTRACT_ADDRESS, ERC20_ABI, provider);

const POLL_INTERVAL_MS = Number(process.env.DEPOSIT_POLL_INTERVAL_MS || 30000);
const SWEEP_THRESHOLD = Number(process.env.SWEEP_THRESHOLD_USDT || 10);

async function pollOnce(io) {
  let decimals;
  try {
    decimals = await usdt.decimals();
  } catch (err) {
    console.error(
      "[deposit-monitor] Impossible de lire le contrat USDT_CONTRACT_ADDRESS. Causes fréquentes : la chaîne locale a été redémarrée depuis le déploiement, ou l'adresse/le RPC_URL est faux. Détail :", err.message
    );
    return;
  }
  const wallets = await Wallet.find({ asset: 'USDT' });

  for (const wallet of wallets) {
    try {
      const onChainRaw = await usdt.balanceOf(wallet.depositAddress);
      const onChain = Number(ethers.formatUnits(onChainRaw, decimals));
      const creditedSoFar = wallet.available + wallet.locked + (wallet.sweptTotal || 0);
      const newDeposit = onChain - creditedSoFar;

      if (newDeposit > 0.000001) {
        wallet.available += newDeposit;
        await wallet.save();
        await WalletMovement.create({ user: wallet.user, type: 'depot', amount: newDeposit, status: 'confirme' });
        io?.to(`user:${wallet.user}`).emit('deposit:credited', { asset: 'USDT', amount: newDeposit });
        console.log(`[deposit-monitor] +${newDeposit} USDT crédité pour ${wallet.depositAddress}`);
      }

      if (onChain >= SWEEP_THRESHOLD) {
        const swept = await signerClient.sweep(wallet.derivationIndex, process.env.HOT_WALLET_ADDRESS);
        wallet.sweptTotal = (wallet.sweptTotal || 0) + Number(swept.swept);
        await wallet.save();
        console.log(`[deposit-monitor] balayage ${swept.swept} USDT — tx ${swept.txHash}`);
      }
    } catch (err) {
      console.error(`[deposit-monitor] erreur pour ${wallet.depositAddress} :`, err.message);
    }
  }
}

function startDepositMonitor(io) {
  console.log('[deposit-monitor] démarré, intervalle', POLL_INTERVAL_MS, 'ms');
  setInterval(() => pollOnce(io).catch(console.error), POLL_INTERVAL_MS);
}

module.exports = { startDepositMonitor };