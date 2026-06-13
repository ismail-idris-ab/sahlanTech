const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  getAdminCheckIns,
  deleteCheckIn,
  deleteCheckIns,
  exportCheckIns,
} = require('../controllers/dailyCheckIn.controller');

router.use(authMiddleware);
router.get('/', getAdminCheckIns);
router.get('/export', exportCheckIns);
router.delete('/:id', deleteCheckIn);
router.delete('/', deleteCheckIns);

module.exports = router;
