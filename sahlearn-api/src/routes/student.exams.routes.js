// sahlearn-api/src/routes/student.exams.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const studentAuth = require('../middleware/studentAuth');
const { listExams, getExam, submitExam, getMyAttempts } = require('../controllers/student.exams.controller');

router.use(studentAuth);

router.get('/', listExams);
router.get('/my-attempts', getMyAttempts); // MUST be before /:id
router.get('/:id', getExam);
router.post(
  '/:id/submit',
  [body('answers').isArray().withMessage('answers must be an array')],
  validate,
  submitExam
);

module.exports = router;
