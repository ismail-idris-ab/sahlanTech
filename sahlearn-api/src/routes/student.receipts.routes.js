const express = require('express');
const router = express.Router();
const studentAuth = require('../middleware/studentAuth');
const { getMyReceipts } = require('../controllers/student.receipts.controller');

router.use(studentAuth);
router.get('/', getMyReceipts);

module.exports = router;
