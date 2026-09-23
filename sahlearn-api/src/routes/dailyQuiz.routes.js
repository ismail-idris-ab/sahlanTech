// sahlearn-api/src/routes/dailyQuiz.routes.js — PUBLIC. No auth middleware here.
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { quizReadLimiter, quizStartLimiter, quizSubmitLimiter } = require('../middleware/rateLimit');
const { getToday, startAttempt, submitAttempt, getLeaderboard } = require('../controllers/dailyQuiz.controller');
const { ESSAY_MAX_LENGTH } = require('../utils/scoreQuiz');

router.get('/today', quizReadLimiter, getToday);

router.get('/leaderboard', quizReadLimiter, getLeaderboard);

router.post(
  '/start',
  quizStartLimiter,
  [
    body('studentId')
      .isString()
      .withMessage('Student ID is required')
      .bail()
      .trim()
      .notEmpty()
      .withMessage('Student ID is required')
      .isLength({ max: 50 }),
  ],
  validate,
  startAttempt
);

router.post(
  '/submit',
  quizSubmitLimiter,
  [
    body('attemptToken').isString().notEmpty().withMessage('Missing quiz session'),
    body('answers').optional().isArray({ max: 50 }).withMessage('answers must be an array'),
    // Essay text is the only unbounded field a public caller can send. Capped
    // here rather than truncated silently, so a student who genuinely wrote too
    // much is told instead of losing the tail of their answer.
    body('answers').optional().custom((answers) => {
      if (!Array.isArray(answers)) return true;
      for (const a of answers) {
        if (a && typeof a === 'object' && typeof a.text === 'string' && a.text.length > ESSAY_MAX_LENGTH) {
          throw new Error(`Written answers are limited to ${ESSAY_MAX_LENGTH} characters`);
        }
      }
      return true;
    }),
  ],
  validate,
  submitAttempt
);

module.exports = router;
