// sahlearn-api/src/routes/admin.dailyQuizzes.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const {
  listQuizzes,
  createQuiz,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  getResults,
} = require('../controllers/admin.dailyQuizzes.controller');

router.use(authMiddleware);

const questionsValidator = body('questions')
  .isArray({ min: 5, max: 10 })
  .withMessage('A daily quiz needs between 5 and 10 questions');

router.get('/', listQuizzes);
router.post(
  '/',
  [
    body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('isPublished').optional().isBoolean(),
    questionsValidator,
  ],
  validate,
  createQuiz
);
router.get('/:id', getQuiz);
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('isPublished').optional().isBoolean(),
    body('questions').optional().isArray({ min: 5, max: 10 })
      .withMessage('A daily quiz needs between 5 and 10 questions'),
  ],
  validate,
  updateQuiz
);
router.delete('/:id', deleteQuiz);
router.get('/:id/results', getResults);

module.exports = router;
