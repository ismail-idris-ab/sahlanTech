const router = require('express').Router();
const ctrl = require('../controllers/posts.controller');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { postCreateValidator, postUpdateValidator } = require('../validators/posts.validator');

// Public
router.get('/', ctrl.list);
router.get('/:slug', ctrl.getBySlug);

// Admin write operations
router.post('/', authMiddleware, postCreateValidator, validate, ctrl.create);
router.patch('/:id', authMiddleware, postUpdateValidator, validate, ctrl.update);
router.delete('/:id', authMiddleware, ctrl.remove);

module.exports = router;
