const { body } = require('express-validator');
const { CONTACT_STATUSES, NIGERIAN_PHONE_RE } = require('../utils/constants');

const contactCreateValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 chars'),
  body('email').isEmail().trim().toLowerCase().withMessage('Valid email required'),
  body('phone')
    .optional({ checkFalsy: true })
    .matches(NIGERIAN_PHONE_RE)
    .withMessage('Invalid Nigerian phone number'),
  body('subject').trim().isLength({ min: 3, max: 150 }).withMessage('Subject must be 3–150 chars'),
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10–2000 chars'),
];

const contactUpdateValidator = [
  body('status').isIn(CONTACT_STATUSES).withMessage(`Status must be one of: ${CONTACT_STATUSES.join(', ')}`),
];

module.exports = { contactCreateValidator, contactUpdateValidator };
