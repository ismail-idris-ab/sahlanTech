const express = require('express');
const router = express.Router();
const studentAuth = require('../middleware/studentAuth');
const { uploadDoc } = require('../middleware/upload');
const { getMessages, sendMessage, getUnreadCount } = require('../controllers/student.messages.controller');

router.use(studentAuth);

router.get('/', getMessages);
router.get('/unread-count', getUnreadCount);
router.post('/', uploadDoc.single('file'), sendMessage);

module.exports = router;
