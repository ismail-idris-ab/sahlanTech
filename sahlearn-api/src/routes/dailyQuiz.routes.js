// sahlearn-api/src/routes/dailyQuiz.routes.js — PUBLIC. No auth middleware here.
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { quizReadLimiter, quizStartLimiter, quizSubmitLimiter } = require('../middleware/rateLimit');
const { getToday, startAttempt, submitAttempt } = require('../controllers/dailyQuiz.controller');

router.get('/today', quizReadLimiter, getToday);

router.post(
  '/start',
  quizStartLimiter,
  [body('studentId').trim().notEmpty().withMessage('Student ID is required').isLength({ max: 50 })],
  validate,
  startAttempt
);

router.post(
  '/submit',
  quizSubmitLimiter,
  [
    body('attemptToken').isString().notEmpty().withMessage('Missing quiz session'),
    body('answers').optional().isArray({ max: 50 }).withMessage('answers must be an array'),
  ],
  validate,
  submitAttempt
);

module.exports = router;
