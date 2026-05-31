// sahlearn-api/src/routes/admin.attendance.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createSession, listSessions, getSession,
  updateSession, deleteSession, saveRecords,
} = require('../controllers/admin.attendance.controller');

router.use(authMiddleware);

router.get('/sessions', listSessions);
router.post('/sessions', createSession);
router.get('/sessions/:id', getSession);
router.patch('/sessions/:id', updateSession);
router.delete('/sessions/:id', deleteSession);
router.put('/sessions/:id/records', saveRecords);

module.exports = router;
