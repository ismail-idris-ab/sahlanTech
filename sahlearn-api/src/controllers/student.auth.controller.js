// sahlearn-api/src/controllers/student.auth.controller.js
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const { success } = require('../utils/apiResponse');
const { sendMail } = require('../utils/mailer');
const { passwordResetTemplate } = require('../utils/emailTemplates');

const login = async (req, res) => {
  const { email, password } = req.body;

  const student = await Student.findOne({ email }).select('+password');
  if (!student || !student.isActive) {
    return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
  }

  const match = await student.comparePassword(password);
  if (!match) {
    return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
  }

  student.lastLoginAt = new Date();
  await student.save();

  const token = jwt.sign(
    { id: student._id, role: 'student' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  success(res, {
    token,
    student: {
      id: student._id,
      studentId: student.studentId,
      fullName: student.fullName,
      email: student.email,
      avatar: student.avatar,
    },
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const msg = 'If that email is registered, a reset link has been sent.';

  const student = await Student.findOne({ email });
  if (!student) return success(res, { message: msg }); // prevent email enumeration

  const rawToken = crypto.randomBytes(32).toString('hex');
  student.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  student.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await student.save();

  const clientUrl = (process.env.CORS_ORIGIN || '').split(',')[0].trim();
  const resetUrl = `${clientUrl}/student/reset-password?token=${rawToken}`;

  sendMail({
    to: student.email,
    subject: 'Reset Your Sahlearn Password',
    html: passwordResetTemplate({ fullName: student.fullName, resetUrl }),
  });

  success(res, { message: msg });
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const student = await Student.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  }).select('+password +passwordResetToken +passwordResetExpires');

  if (!student) {
    return res.status(400).json({ status: 'error', message: 'Invalid or expired reset token' });
  }

  student.password = password;
  student.passwordResetToken = undefined;
  student.passwordResetExpires = undefined;
  await student.save();

  success(res, { message: 'Password reset successful. Please log in.' });
};

module.exports = { login, forgotPassword, resetPassword };
