// sahlearn-api/src/routes/student.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const studentAuth = require('../middleware/studentAuth');
const { upload } = require('../middleware/upload');
const { getMe, updateMe, uploadAvatar, deleteAvatar, changePassword, setFirstPassword, getStats, getProgress } = require('../controllers/student.controller');

router.use(studentAuth);

router.get('/stats', getStats);
router.get('/progress', getProgress);
router.get('/me', getMe);

router.patch(
  '/me',
  [
    body('fullName').optional().isLength({ min: 2, max: 100 }),
    body('bio').optional().isLength({ max: 300 }),
    body('dateOfBirth').optional({ checkFalsy: true }).isISO8601(),
    body('academicLevel').optional({ checkFalsy: true }).isIn(['ND1', 'ND2', 'HND1', 'HND2']),
  ],
  validate,
  updateMe
);

router.post('/me/avatar', upload.single('image'), uploadAvatar);
router.delete('/me/avatar', deleteAvatar);
router.patch('/me/set-password', setFirstPassword);

router.patch(
  '/me/password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  changePassword
);

module.exports = router;
