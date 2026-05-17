const router = require('express').Router();
const ctrl = require('../controllers/contact.controller');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { contactLimiter } = require('../middleware/rateLimit');
const { contactCreateValidator, contactUpdateValidator } = require('../validators/contact.validator');

// Public
router.post('/', contactLimiter, contactCreateValidator, validate, ctrl.create);

// Admin
router.get('/', authMiddleware, ctrl.list);
router.patch('/:id', authMiddleware, contactUpdateValidator, validate, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
