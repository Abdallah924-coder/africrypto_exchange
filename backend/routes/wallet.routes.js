const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getMyWallet, depositWebhook, withdraw } = require('../controllers/wallet.controller');

router.get('/me', requireAuth, getMyWallet);
router.post('/withdraw', requireAuth, withdraw);
router.post('/webhook/deposit', depositWebhook); // appelé par le service de monitoring, pas par le frontend

module.exports = router;
