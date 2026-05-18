const { body } = require('express-validator');

const loginValidator = [
  body('email').isEmail().trim().toLowerCase().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),
  body('email').isEmail().trim().toLowerCase().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

module.exports = { loginValidator, registerValidator };
