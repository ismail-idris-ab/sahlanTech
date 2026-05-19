const { body } = require('express-validator');
const { ENROLLMENT_STATUSES, ENROLLMENT_MODES, PAYMENT_METHODS, PAYMENT_STATUSES, NIGERIAN_PHONE_RE } = require('../utils/constants');

const enrollmentCreateValidator = [
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Full name must be 2–100 chars'),
  body('email').isEmail().trim().toLowerCase().withMessage('Valid email required'),
  body('phone')
    .matches(NIGERIAN_PHONE_RE)
    .withMessage('Valid Nigerian phone number required (e.g. 08012345678 or +2348012345678)'),
  body('course')
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage('Invalid course ID'),
  body('courseTitleSnapshot')
    .optional({ checkFalsy: true })
    .trim(),
  body('preferredStartDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Invalid date format'),
  body('mode').isIn(ENROLLMENT_MODES).withMessage(`Mode must be one of: ${ENROLLMENT_MODES.join(', ')}`),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS).withMessage(`Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`),
  body('paymentRef').optional().trim().isLength({ max: 100 }),
  body('amountPaid').optional().isNumeric().withMessage('Amount must be a number'),
];

const enrollmentUpdateValidator = [
  body('status')
    .optional()
    .isIn(ENROLLMENT_STATUSES)
    .withMessage(`Status must be one of: ${ENROLLMENT_STATUSES.join(', ')}`),
  body('paymentStatus')
    .optional()
    .isIn(PAYMENT_STATUSES)
    .withMessage(`Payment status must be one of: ${PAYMENT_STATUSES.join(', ')}`),
];

module.exports = { enrollmentCreateValidator, enrollmentUpdateValidator };
