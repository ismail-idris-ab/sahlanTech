// sahlearn-api/src/routes/student.attendance.routes.js
const express = require('express');
const router = express.Router();
const studentAuth = require('../middleware/studentAuth');
const { getMyAttendance } = require('../controllers/student.attendance.controller');

router.use(studentAuth);
router.get('/', getMyAttendance);

module.exports = router;
