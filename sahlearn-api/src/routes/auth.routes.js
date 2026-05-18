const router = require('express').Router();
const { login, me, register, listAdmins, deleteAdmin } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimit');
const { loginValidator, registerValidator } = require('../validators/auth.validator');

router.post('/login', loginLimiter, loginValidator, validate, login);
router.get('/me', authMiddleware, me);
router.post('/register', authMiddleware, registerValidator, validate, register);
router.get('/users', authMiddleware, listAdmins);
router.delete('/users/:id', authMiddleware, deleteAdmin);

module.exports = router;
