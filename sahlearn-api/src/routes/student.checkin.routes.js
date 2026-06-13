const express = require('express');
const router = express.Router();
const studentAuth = require('../middleware/studentAuth');
const { checkIn, getMyCheckIns } = require('../controllers/dailyCheckIn.controller');

router.use(studentAuth);
router.post('/', checkIn);
router.get('/me', getMyCheckIns);

module.exports = router;
