// sahlearn-api/src/routes/admin.students.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { list, getById, resetPassword, updateStatus, getStudentProgress, impersonateStudent, deleteStudent, deleteStudents } = require('../controllers/admin.students.controller');
const { getStudentAttendance } = require('../controllers/admin.attendance.controller');

router.use(authMiddleware);

router.get('/', list);
router.get('/:id/progress', getStudentProgress);
router.get('/:id/attendance', getStudentAttendance);
router.get('/:id', getById);
router.post('/:id/reset-password', resetPassword);
router.post('/:id/impersonate', impersonateStudent);
router.patch('/:id/status', updateStatus);
router.delete('/:id', deleteStudent);
router.delete('/', deleteStudents);

module.exports = router;
