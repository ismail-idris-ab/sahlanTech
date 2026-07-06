// sahlearn-api/src/routes/admin.assignments.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const {
  createAssignment,
  listAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  listSubmissions,
  gradeSubmission,
} = require('../controllers/admin.assignments.controller');

router.use(authMiddleware);

router.get('/', listAssignments);
router.post(
  '/',
  [
    body('course').if((_val, { req }) => !req.body.isGeneral).notEmpty().withMessage('Course ID is required'),
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 3000 }),
    body('dueDate').optional().isISO8601(),
    body('isPublished').optional().isBoolean(),
  ],
  validate,
  createAssignment
);
router.get('/:id', getAssignment);
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 3000 }),
    body('dueDate').optional().isISO8601(),
    body('isPublished').optional().isBoolean(),
  ],
  validate,
  updateAssignment
);
router.delete('/:id', deleteAssignment);
router.get('/:id/submissions', listSubmissions);
router.patch(
  '/submissions/:submissionId',
  [
    body('grade').optional().trim().isLength({ max: 20 }),
    body('feedback').optional().isLength({ max: 2000 }),
    body('status').optional().isIn(['submitted', 'graded', 'returned']),
  ],
  validate,
  gradeSubmission
);

module.exports = router;
