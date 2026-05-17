const router = require('express').Router();
const ctrl = require('../controllers/courses.controller');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { courseCreateValidator, courseUpdateValidator } = require('../validators/courses.validator');

// Public
router.get('/', ctrl.list);
router.get('/:slug', ctrl.getBySlug);

// Admin write operations
router.post('/', authMiddleware, courseCreateValidator, validate, ctrl.create);
router.patch('/:id', authMiddleware, courseUpdateValidator, validate, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
