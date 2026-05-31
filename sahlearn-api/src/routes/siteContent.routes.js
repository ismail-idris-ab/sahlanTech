const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/siteContent.controller');
const authMiddleware = require('../middleware/auth');

router.get('/:key', ctrl.getContent);
router.put('/:key', authMiddleware, ctrl.upsertContent);

module.exports = router;
