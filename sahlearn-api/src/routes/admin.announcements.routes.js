// sahlearn-api/src/routes/admin.announcements.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { uploadDoc } = require('../middleware/upload');
const { create, list, update, remove } = require('../controllers/admin.announcements.controller');

router.use(authMiddleware);

router.get('/', list);
router.post('/', uploadDoc.single('file'), create);
router.patch('/:id', uploadDoc.single('file'), update);
router.delete('/:id', remove);

module.exports = router;
