// sahlearn-api/src/routes/admin.students.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { list, getById, resetPassword, updateStatus } = require('../controllers/admin.students.controller');

router.use(authMiddleware);

router.get('/', list);
router.get('/:id', getById);
router.post('/:id/reset-password', resetPassword);
router.patch('/:id/status', updateStatus);

module.exports = router;
