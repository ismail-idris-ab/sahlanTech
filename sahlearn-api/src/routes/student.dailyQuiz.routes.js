const express = require('express');
const router = express.Router();
const studentAuth = require('../middleware/studentAuth');
const { getMyHistory } = require('../controllers/student.dailyQuiz.controller');

router.use(studentAuth);
router.get('/history', getMyHistory);

module.exports = router;
