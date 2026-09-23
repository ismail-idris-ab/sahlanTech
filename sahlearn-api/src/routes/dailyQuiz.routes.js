// sahlearn-api/src/routes/dailyQuiz.routes.js — PUBLIC. No auth middleware here.
const express = require('express');
const router = express.Router();
const { quizReadLimiter } = require('../middleware/rateLimit');
const { getToday } = require('../controllers/dailyQuiz.controller');

router.get('/today', quizReadLimiter, getToday);

module.exports = router;
