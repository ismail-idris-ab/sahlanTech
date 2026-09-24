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
  getAttempt,
  gradeAttempt,
} = require('../controllers/admin.dailyQuizzes.controller');

router.use(authMiddleware);

const questionsValidator = body('questions')
  .isArray({ min: 1, max: 10 })
  .withMessage('A daily quiz needs between 1 and 10 questions');

// Length alone doesn't catch malformed elements (e.g. questions: [1,2,3,4,5] or
// objects missing required fields) — those would otherwise reach Mongoose and
// throw a ValidationError/CastError that the central handler turns into a 500.
//
// The shape rules differ by question type, and the fields that decide which
// rules apply (`type`, `options`, `correctIndex`) only make sense read together:
// a two-option question with correctIndex 2 passes isInt and isArray
// individually and fails only Mongoose's cross-field validator, and an essay
// question must be exempt from the option rules entirely. So the whole element
// is validated here, in one place, where every field of the same question is
// visible at once.
const validateQuestionShapes = (questions) => {
  if (!Array.isArray(questions)) return true; // shape already reported by isArray() above

  questions.forEach((q, i) => {
    const label = `Question ${i + 1}`;
    if (q === null || typeof q !== 'object' || Array.isArray(q)) {
      throw new Error(`${label}: each question must be an object`);
    }

    const type = q.type === undefined ? 'mcq' : q.type;
    if (type !== 'mcq' && type !== 'essay') {
      throw new Error(`${label}: type must be either mcq or essay`);
    }

    if (type === 'essay') {
      // Rejected rather than ignored: silently dropping a correct answer the
      // admin thought they had set would be worse than telling them.
      if (q.correctIndex !== undefined && q.correctIndex !== null) {
        throw new Error(`${label}: an essay question cannot have a correct answer`);
      }
      if (Array.isArray(q.options) && q.options.length > 0) {
        throw new Error(`${label}: an essay question cannot have options`);
      }
      return;
    }

    const { options } = q;
    if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
      throw new Error(`${label}: needs between 2 and 4 options`);
    }
    if (!options.every((o) => typeof o === 'string' && o.trim().length > 0)) {
      throw new Error(`${label}: options cannot be blank`);
    }
    // Sanitize in place, as the per-field .trim() used to.
    q.options = options.map((o) => o.trim());

    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      throw new Error(`${label}: the correct answer must be one of its options`);
    }
  });

  return true;
};

const questionShapeValidators = [
  body('questions.*.text').trim().notEmpty().withMessage('Each question needs text').isLength({ max: 1000 }),
  body('questions.*.points').optional().isInt({ min: 1 }),
  body('questions').custom(validateQuestionShapes),
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
  body('questions.*.points').if(hasQuestionsField).optional().isInt({ min: 1 }),
  body('questions').if(hasQuestionsField).custom(validateQuestionShapes),
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
    body('questions').optional().isArray({ min: 1, max: 10 })
      .withMessage('A daily quiz needs between 1 and 10 questions'),
    ...optionalQuestionShapeValidators,
  ],
  validate,
  updateQuiz
);
router.delete('/:id', deleteQuiz);
router.get('/:id/results', getResults);

// Essay grading. The per-mark bounds check needs the question's own `points`,
// which only the controller has, so this validator only proves the shape.
router.get('/:id/attempts/:attemptId', getAttempt);
router.patch(
  '/:id/attempts/:attemptId/grades',
  [
    body('grades').isArray({ min: 1, max: 10 }).withMessage('Send at least one mark'),
    body('grades').custom((grades) => {
      if (!Array.isArray(grades)) return true;
      grades.forEach((g, i) => {
        if (g === null || typeof g !== 'object' || Array.isArray(g)) {
          throw new Error(`Mark ${i + 1}: malformed`);
        }
        if (!Number.isInteger(g.questionIndex) || g.questionIndex < 0) {
          throw new Error(`Mark ${i + 1}: questionIndex must be a whole number`);
        }
        if (typeof g.awardedPoints !== 'number' || !Number.isFinite(g.awardedPoints) || g.awardedPoints < 0) {
          throw new Error(`Mark ${i + 1}: awardedPoints must be zero or more`);
        }
      });
      return true;
    }),
  ],
  validate,
  gradeAttempt
);

module.exports = router;
