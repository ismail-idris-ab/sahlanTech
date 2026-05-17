const router = require('express').Router();
const { login, me } = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimit');
const { loginValidator } = require('../validators/auth.validator');

router.post('/login', loginLimiter, loginValidator, validate, login);
router.get('/me', authMiddleware, me);

module.exports = router;
