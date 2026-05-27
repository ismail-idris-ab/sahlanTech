const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const studentAuth = require('../middleware/studentAuth');
const { getMessages, sendMessage, getUnreadCount } = require('../controllers/student.messages.controller');

router.use(studentAuth);

router.get('/', getMessages);
router.get('/unread-count', getUnreadCount);
router.post(
  '/',
  [body('content').trim().notEmpty().isLength({ max: 2000 })],
  validate,
  sendMessage
);

module.exports = router;
