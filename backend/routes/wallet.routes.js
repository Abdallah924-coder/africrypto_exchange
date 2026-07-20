const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { getMyWallet, withdraw, getMovements } = require('../controllers/wallet.controller');

router.get('/me', requireAuth, getMyWallet);
router.post('/withdraw', requireAuth, withdraw);
router.get('/movements', requireAuth, getMovements);

module.exports = router;