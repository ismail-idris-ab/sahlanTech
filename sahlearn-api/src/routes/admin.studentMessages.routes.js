const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const { listConversations, getConversation, sendReply, getTotalUnread } = require('../controllers/admin.studentMessages.controller');

router.use(authMiddleware);

router.get('/', listConversations);
router.get('/unread-count', getTotalUnread);
router.get('/:studentId', getConversation);
router.post(
  '/:studentId',
  [body('content').trim().notEmpty().isLength({ max: 2000 })],
  validate,
  sendReply
);

module.exports = router;
