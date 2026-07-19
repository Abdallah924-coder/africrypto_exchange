const router = require('express').Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const c = require('../controllers/admin.controller');

router.use(requireAuth, requireAdmin);

router.get('/disputes', c.listDisputes);
router.post('/disputes/:id/resolve', c.resolveDispute);
router.get('/users', c.listUsers);
router.post('/users/:id/suspend', c.suspendUser);

module.exports = router;
