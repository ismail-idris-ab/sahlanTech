// sahlearn-api/src/routes/student.announcements.routes.js
const express = require('express');
const router = express.Router();
const studentAuth = require('../middleware/studentAuth');
const { getMyAnnouncements } = require('../controllers/student.announcements.controller');

router.use(studentAuth);
router.get('/', getMyAnnouncements);

module.exports = router;
