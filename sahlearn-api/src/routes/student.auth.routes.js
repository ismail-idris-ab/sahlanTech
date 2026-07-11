// sahlearn-api/src/routes/student.auth.routes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { login, forgotPassword, resetPassword } = require('../controllers/student.auth.controller');

// Key by email + IP so brute-force protection is per-account. Otherwise a whole
// class behind one NAT/wifi IP shares a single bucket and locks each other out.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${(req.body?.email || '').toLowerCase().trim()}`,
});

router.post(
  '/login',
  loginLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  login
);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  resetPassword
);

module.exports = router;
