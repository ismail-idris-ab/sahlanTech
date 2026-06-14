const express = require('express');
const router = express.Router();
const studentAuth = require('../middleware/studentAuth');
const { checkinLimiter } = require('../middleware/rateLimit');
const { checkIn, getMyCheckIns } = require('../controllers/dailyCheckIn.controller');

router.use(studentAuth);
router.post('/', checkinLimiter, checkIn);
router.get('/me', getMyCheckIns);

module.exports = router;
