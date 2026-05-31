// sahlearn-api/src/routes/exports.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { studentReportCard, attendanceRegister, examResultsCSV, assignmentResultsCSV } = require('../controllers/exports.controller');

router.use(authMiddleware);

router.get('/students/:id/report.pdf', studentReportCard);
router.get('/attendance/:sessionId/register.pdf', attendanceRegister);
router.get('/exams/:id/results.csv', examResultsCSV);
router.get('/assignments/:id/results.csv', assignmentResultsCSV);

module.exports = router;
