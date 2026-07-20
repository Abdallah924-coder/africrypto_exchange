const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/p2p.controller');

router.get('/listings', c.getListings);
router.post('/listings', requireAuth, c.createListing);
router.post('/buy', requireAuth, c.buy);
router.get('/transactions/mine', requireAuth, c.getMyTransactions);
router.get('/transactions/:id', requireAuth, c.getTransaction);
router.post('/transactions/:id/declare-paid', requireAuth, c.declarePaid);
router.post('/transactions/:id/confirm-release', requireAuth, c.confirmRelease);
router.post('/transactions/:id/dispute', requireAuth, c.openDispute);
router.get('/transactions/:id/messages', requireAuth, c.getMessages);

module.exports = router;