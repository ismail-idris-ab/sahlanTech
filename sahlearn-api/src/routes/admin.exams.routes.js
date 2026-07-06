// sahlearn-api/src/routes/admin.exams.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const {
  createExam,
  listExams,
  getExam,
  updateExam,
  deleteExam,
  listAttempts,
  reviewAttempt,
} = require('../controllers/admin.exams.controller');

router.use(authMiddleware);

const questionValidator = body('questions')
  .optional()
  .isArray()
  .withMessage('questions must be an array');

router.get('/', listExams);
router.post(
  '/',
  [
    body('course').if(body('isGeneral').not().equals(true)).notEmpty().withMessage('Course ID is required'),
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('duration').optional().isInt({ min: 1 }),
    body('dueDate').optional().isISO8601(),
    body('isPublished').optional().isBoolean(),
    questionValidator,
  ],
  validate,
  createExam
);
router.get('/:id', getExam);
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('duration').optional().isInt({ min: 1 }),
    body('dueDate').optional().isISO8601(),
    body('isPublished').optional().isBoolean(),
    questionValidator,
  ],
  validate,
  updateExam
);
router.delete('/:id', deleteExam);
router.get('/:id/attempts', listAttempts);
router.patch(
  '/attempts/:attemptId',
  [
    body('adminNote').optional().isLength({ max: 2000 }),
    body('status').optional().isIn(['submitted', 'reviewed']),
  ],
  validate,
  reviewAttempt
);

module.exports = router;
