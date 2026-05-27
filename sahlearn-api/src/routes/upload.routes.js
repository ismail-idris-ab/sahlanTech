const router = require('express').Router();
const { single } = require('../controllers/upload.controller');
const authMiddleware = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', authMiddleware, upload.single('image'), single);

module.exports = router;
