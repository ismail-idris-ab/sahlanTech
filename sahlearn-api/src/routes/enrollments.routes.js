const router = require('express').Router();
const ctrl = require('../controllers/enrollments.controller');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { enrollmentLimiter } = require('../middleware/rateLimit');
const { enrollmentCreateValidator, enrollmentUpdateValidator } = require('../validators/enrollments.validator');

// Public
router.post('/', enrollmentLimiter, enrollmentCreateValidator, validate, ctrl.create);

// Admin
router.get('/', authMiddleware, ctrl.list);
router.patch('/:id', authMiddleware, enrollmentUpdateValidator, validate, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
