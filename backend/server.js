require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const registerChatSocket = require('./sockets/chat.socket');
const { startDepositMonitor } = require('./services/depositMonitor');
const { seedAdmin } = require('./config/adminSeed');

const authRoutes = require('./routes/auth.routes');
const walletRoutes = require('./routes/wallet.routes');
const p2pRoutes = require('./routes/p2p.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_ORIGIN || '*' }
});

app.set('io', io);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/p2p', p2pRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
});

registerChatSocket(io);

connectDB().then(async () => {
  await seedAdmin();
  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => console.log(`[server] AfriCrypto API sur le port ${PORT}`));
  startDepositMonitor(io);
});