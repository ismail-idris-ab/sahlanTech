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

// Length alone doesn't catch malformed elements (e.g. questions: [1,2,3,4,5] or
// objects missing required fields) — those would otherwise reach Mongoose and
// throw a ValidationError/CastError that the central handler turns into a 500.
// correctIndex and options are each valid on their own (0-3, 2-4 entries) but the
// model additionally requires correctIndex < options.length for THAT question — a
// two-option question with correctIndex 2 or 3 passes both isInt and isArray checks
// individually and only fails Mongoose's cross-field validator, which throws a
// ValidationError the central handler turns into a 500. Check the relationship here,
// where both fields of the same question are visible together.
const correctIndexWithinOptions = (questions) => {
  if (!Array.isArray(questions)) return true; // shape already reported by isArray() above
  questions.forEach((q, i) => {
    const options = q?.options;
    if (!Array.isArray(options)) return; // shape already reported by questions.*.options
    if (!Number.isInteger(q?.correctIndex) || q.correctIndex >= options.length) {
      throw new Error(`Question ${i + 1}: the correct answer must be one of its options`);
    }
  });
  return true;
};

const questionShapeValidators = [
  body('questions.*.text').trim().notEmpty().withMessage('Each question needs text').isLength({ max: 1000 }),
  body('questions.*.options').isArray({ min: 2, max: 4 }).withMessage('Each question needs 2-4 options'),
  body('questions.*.options.*').trim().notEmpty().withMessage('Options cannot be blank'),
  body('questions.*.correctIndex').isInt({ min: 0, max: 3 }).withMessage('Each question needs a correct answer'),
  body('questions.*.points').optional().isInt({ min: 1 }),
  body('questions').custom(correctIndexWithinOptions),
];

// PATCH may omit `questions` entirely (e.g. a title-only edit), in which case these
// must not run at all. But `.optional()` on the field validators themselves is the
// wrong tool for that: express-validator resolves e.g. `questions.0.text` by reading
// `.text` off whatever `questions[0]` is, and for a malformed element like the number
// `1` that read is `undefined` too — so `.optional()` would skip validating it, which
// is exactly the malformed-element case this guard exists to catch. Instead, gate on
// whether the top-level `questions` field was sent at all, and once it is sent,
// validate every element unconditionally.
const hasQuestionsField = (_value, { req }) => req.body.questions !== undefined;

const optionalQuestionShapeValidators = [
  body('questions.*.text').if(hasQuestionsField).trim().notEmpty().withMessage('Each question needs text').isLength({ max: 1000 }),
  body('questions.*.options').if(hasQuestionsField).isArray({ min: 2, max: 4 }).withMessage('Each question needs 2-4 options'),
  body('questions.*.options.*').if(hasQuestionsField).trim().notEmpty().withMessage('Options cannot be blank'),
  body('questions.*.correctIndex').if(hasQuestionsField).isInt({ min: 0, max: 3 }).withMessage('Each question needs a correct answer'),
  body('questions.*.points').if(hasQuestionsField).optional().isInt({ min: 1 }),
  body('questions').if(hasQuestionsField).custom(correctIndexWithinOptions),
];

router.get('/', listQuizzes);
router.post(
  '/',
  [
    body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
    body('title').isString().bail().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isString().bail().isLength({ max: 2000 }),
    body('isPublished').optional().isBoolean(),
    questionsValidator,
    ...questionShapeValidators,
  ],
  validate,
  createQuiz
);
router.get('/:id', getQuiz);
router.patch(
  '/:id',
  [
    body('title').optional().isString().bail().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isString().bail().isLength({ max: 2000 }),
    body('isPublished').optional().isBoolean(),
    body('questions').optional().isArray({ min: 5, max: 10 })
      .withMessage('A daily quiz needs between 5 and 10 questions'),
    ...optionalQuestionShapeValidators,
  ],
  validate,
  updateQuiz
);
router.delete('/:id', deleteQuiz);
router.get('/:id/results', getResults);

module.exports = router;
