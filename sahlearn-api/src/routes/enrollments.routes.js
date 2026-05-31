const router = require('express').Router();
const ctrl = require('../controllers/enrollments.controller');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { enrollmentLimiter } = require('../middleware/rateLimit');
const { enrollmentCreateValidator, enrollmentUpdateValidator } = require('../validators/enrollments.validator');
const { uploadDoc } = require('../middleware/upload');

// Public — optional payment proof attachment
router.post('/', enrollmentLimiter, uploadDoc.single('paymentProof'), enrollmentCreateValidator, validate, ctrl.create);

// Admin
router.get('/', authMiddleware, ctrl.list);
router.patch('/:id/confirm', authMiddleware, ctrl.confirmPayment);
router.post('/:id/payment-proof', authMiddleware, uploadDoc.single('paymentProof'), ctrl.uploadPaymentProof);
router.patch('/:id', authMiddleware, enrollmentUpdateValidator, validate, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
