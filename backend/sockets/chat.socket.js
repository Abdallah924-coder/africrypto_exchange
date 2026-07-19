const { verifyToken } = require('../utils/jwt');
const Message = require('../models/Message');

module.exports = function registerChatSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = verifyToken(token);
      socket.userId = payload.id;
      next();
    } catch {
      next(new Error('Authentification socket invalide'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    socket.on('chat:join', (transactionId) => {
      socket.join(`tx:${transactionId}`);
    });

    socket.on('chat:message', async ({ transactionId, content, attachmentUrl }) => {
      const message = await Message.create({
        transaction: transactionId, sender: socket.userId, content, attachmentUrl
      });
      io.to(`tx:${transactionId}`).emit('chat:message', message);
    });

    socket.on('disconnect', () => {});
  });
};
