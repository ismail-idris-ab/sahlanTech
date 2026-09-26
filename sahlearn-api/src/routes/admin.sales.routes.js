const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const {
  listSales,
  exportSales,
  exportSale,
  bulkDeleteSales,
  deleteSale,
  createSale,
  getSale,
  updateSale,
  voidSale,
  recordPayment,
  voidPayment,
} = require('../controllers/admin.sales.controller');
const { getAdminReceiptPdf } = require('../controllers/receipts.controller');

router.use(authMiddleware);

const NIGERIAN_PHONE = /^(\+234|234|0)[789][01]\d{8}$/;

// isInt() is not enough on its own: express-validator validates arrays element
// by element, so an EMPTY array passes vacuously and reaches Mongoose, which
// throws a CastError the central handler turns into a 500. Every money field
// therefore insists on an actual JSON number.
const wholeNaira = (chain, { min = 0, max = 1000000000, message }) =>
  chain.custom((v) => {
    if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) {
      throw new Error(message);
    }
    return true;
  });

// Money is whole naira everywhere — 1.75 naira
// is not a thing.
const itemValidators = [
  body('items').isArray({ min: 1, max: 20 }).withMessage('Add at least one item'),
  body('items.*.description')
    .isString()
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Every item needs a description')
    .isLength({ max: 200 }),
  wholeNaira(body('items.*.quantity'), { min: 1, max: 10000, message: 'Quantity must be a whole number of 1 or more' }),
  wholeNaira(body('items.*.unitPrice'), { message: 'Price must be a whole number of naira' }),
  body('discount.type').optional().isIn(['amount', 'percent']),
  wholeNaira(body('discount.value').optional(), { message: 'Discount must be a whole number' }),
  body('discount.reason').optional().isString().bail().trim().isLength({ max: 200 }),
  body('notes').optional().isString().bail().trim().isLength({ max: 500 }),
];

const reasonValidator = [
  body('reason')
    .isString()
    .bail()
    .trim()
    .notEmpty()
    .withMessage('A reason is required')
    .isLength({ max: 200 }),
];

router.get('/', listSales);
// Above '/:id', or Express reads 'export' as a sale id.
router.get('/export', exportSales);
router.post('/bulk-delete', bulkDeleteSales);
router.post(
  '/',
  [
    // .isString().bail() before .trim(): express-validator does not write a
    // sanitized value back for non-string input, so trimming an array would
    // otherwise reach the controller and throw a 500.
    body('fullName')
      .isString()
      .bail()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Customer name is required'),
    body('phone')
      .isString()
      .bail()
      .trim()
      .matches(NIGERIAN_PHONE)
      .withMessage('Enter a valid Nigerian phone number, e.g. 08012345678'),
    body('studentId').optional({ values: 'falsy' }).isString().bail().trim().isLength({ max: 50 }),
    ...itemValidators,
  ],
  validate,
  createSale
);
router.get('/:id', getSale);
router.get('/:id/export', exportSale);
router.patch(
  '/:id',
  [
    body('fullName').optional().isString().bail().trim().isLength({ min: 2, max: 100 }),
    body('phone').optional().isString().bail().trim().matches(NIGERIAN_PHONE),
    body('items').optional().isArray({ min: 1, max: 20 }),
    body('items.*.description').optional().isString().bail().trim().notEmpty().isLength({ max: 200 }),
    wholeNaira(body('items.*.quantity').optional(), { min: 1, max: 10000, message: 'Quantity must be a whole number of 1 or more' }),
    wholeNaira(body('items.*.unitPrice').optional(), { message: 'Price must be a whole number of naira' }),
    body('discount.type').optional().isIn(['amount', 'percent']),
    wholeNaira(body('discount.value').optional(), { message: 'Discount must be a whole number' }),
    body('notes').optional().isString().bail().trim().isLength({ max: 500 }),
  ],
  validate,
  updateSale
);
router.post('/:id/void', reasonValidator, validate, voidSale);
router.delete('/:id', deleteSale);
router.post(
  '/:id/payments',
  [
    wholeNaira(body('amount'), { min: 1, message: 'Enter a whole number of naira' }),
    body('method').isIn(['cash', 'transfer', 'pos', 'other']).withMessage('Choose a payment method'),
    body('reference').optional().isString().bail().trim().isLength({ max: 100 }),
    body('paidAt').optional().isISO8601().withMessage('Invalid date'),
  ],
  validate,
  recordPayment
);

// Mounted separately at /api/admin/payments — a receipt is not a child of the
// sales collection path once it exists.
const paymentsRouter = express.Router();
paymentsRouter.use(authMiddleware);
paymentsRouter.post('/:id/void', reasonValidator, validate, voidPayment);
paymentsRouter.get('/:id/pdf', getAdminReceiptPdf);

module.exports = router;
module.exports.paymentsRouter = paymentsRouter;
