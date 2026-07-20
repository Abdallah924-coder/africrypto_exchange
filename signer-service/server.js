require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');
const { deriveDepositWallet } = require('./hdWallet');
const { ERC20_ABI } = require('./erc20');

const app = express();
app.use(express.json());

function assertConfig() {
  const required = ['RPC_URL', 'USDT_CONTRACT_ADDRESS', 'HOT_WALLET_PRIVATE_KEY', 'SHARED_SECRET'];
  for (const key of required) {
    if (!process.env[key] || process.env[key].startsWith('replace_with') || process.env[key].startsWith('change_this')) {
      console.error(`[signer] Variable manquante ou non renseignée dans signer-service/.env : ${key}`);
      process.exit(1);
    }
  }
  if (!ethers.isAddress(process.env.USDT_CONTRACT_ADDRESS)) {
    console.error(`[signer] USDT_CONTRACT_ADDRESS invalide : "${process.env.USDT_CONTRACT_ADDRESS}"`);
    process.exit(1);
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(process.env.HOT_WALLET_PRIVATE_KEY)) {
    console.error('[signer] HOT_WALLET_PRIVATE_KEY mal formée — doit commencer par 0x suivi de 64 caractères hexadécimaux.');
    process.exit(1);
  }
}
assertConfig();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const hotWallet = new ethers.Wallet(process.env.HOT_WALLET_PRIVATE_KEY, provider);
const usdt = new ethers.Contract(process.env.USDT_CONTRACT_ADDRESS, ERC20_ABI, provider);

const GAS_TOPUP_WEI = ethers.parseEther('0.001');

function requireSharedSecret(req, res, next) {
  if (req.headers['x-internal-secret'] !== process.env.SHARED_SECRET) {
    return res.status(403).json({ message: 'Non autorisé' });
  }
  next();
}
app.use(requireSharedSecret);

app.post('/derive', (req, res) => {
  const { index } = req.body;
  if (typeof index !== 'number' || index < 0) {
    return res.status(400).json({ message: 'index invalide' });
  }
  const { address } = deriveDepositWallet(index);
  res.json({ address, derivationIndex: index });
});

app.post('/sweep', async (req, res) => {
  try {
    const { index, toAddress } = req.body;
    const { address, privateKey } = deriveDepositWallet(index);
    const depositSigner = new ethers.Wallet(privateKey, provider);
    const decimals = await usdt.decimals();
    const balance = await usdt.balanceOf(address);
    if (balance === 0n) return res.status(400).json({ message: 'Aucun solde à balayer' });
    const nativeBalance = await provider.getBalance(address);
    if (nativeBalance < GAS_TOPUP_WEI) {
      const topup = await hotWallet.sendTransaction({ to: address, value: GAS_TOPUP_WEI });
      await topup.wait();
    }
    const usdtWithSigner = usdt.connect(depositSigner);
    const tx = await usdtWithSigner.transfer(toAddress, balance);
    const receipt = await tx.wait();
    res.json({ swept: ethers.formatUnits(balance, decimals), txHash: receipt.hash, from: address });
  } catch (err) {
    console.error('[sweep]', err);
    res.status(500).json({ message: 'Échec du balayage', detail: err.message });
  }
});

app.post('/withdraw', async (req, res) => {
  try {
    const { toAddress, amount } = req.body;
    if (!ethers.isAddress(toAddress)) {
      return res.status(400).json({ message: 'Adresse de destination invalide' });
    }
    const decimals = await usdt.decimals();
    const amountUnits = ethers.parseUnits(String(amount), decimals);
    const usdtWithSigner = usdt.connect(hotWallet);
    const tx = await usdtWithSigner.transfer(toAddress, amountUnits);
    const receipt = await tx.wait();
    res.json({ status: 'confirme', txHash: receipt.hash, toAddress, amount });
  } catch (err) {
    console.error('[withdraw]', err);
    res.status(500).json({ message: 'Échec du retrait', detail: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4100;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[signer] service de signature démarré sur 127.0.0.1:${PORT}`);
});