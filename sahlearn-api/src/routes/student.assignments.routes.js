// sahlearn-api/src/routes/student.assignments.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const studentAuth = require('../middleware/studentAuth');
const { uploadAssignment } = require('../middleware/upload');
const { listAssignments, getAssignment, submitAssignment, getMySubmissions } = require('../controllers/student.assignments.controller');

router.use(studentAuth);

router.get('/', listAssignments);
router.get('/my-submissions', getMySubmissions);
router.get('/:id', getAssignment);
router.post(
  '/:id/submit',
  uploadAssignment.single('file'),
  [body('note').optional().trim().isLength({ max: 1000 })],
  validate,
  submitAssignment
);

module.exports = router;
