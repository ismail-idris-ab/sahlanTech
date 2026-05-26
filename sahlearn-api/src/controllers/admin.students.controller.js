// sahlearn-api/src/controllers/admin.students.controller.js
const crypto = require('crypto');
const Student = require('../models/Student');
const { success, successList, notFound } = require('../utils/apiResponse');
const { sendMail } = require('../utils/mailer');
const { passwordResetTemplate } = require('../utils/emailTemplates');

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

const list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (req.query.search) {
    const re = new RegExp(req.query.search, 'i');
    filter.$or = [{ fullName: re }, { email: re }, { studentId: re }];
  }
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

  const [data, total] = await Promise.all([
    Student.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-passwordResetToken -passwordResetExpires'),
    Student.countDocuments(filter),
  ]);

  successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
};

const getById = async (req, res) => {
  const student = await Student.findById(req.params.id)
    .select('-passwordResetToken -passwordResetExpires')
    .populate('enrolledCourses.course', 'title slug coverImage category');
  if (!student) return notFound(res, 'Student not found');
  success(res, student);
};

const resetPassword = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return notFound(res, 'Student not found');

  const rawToken = crypto.randomBytes(32).toString('hex');
  student.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  student.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await student.save();

  const clientUrl = (process.env.CORS_ORIGIN || '').split(',')[0].trim();
  const resetUrl = `${clientUrl}/student/reset-password?token=${rawToken}`;

  sendMail({
    to: student.email,
    subject: 'Your Sahlearn Password Has Been Reset',
    html: passwordResetTemplate({ fullName: student.fullName, resetUrl }),
  });

  success(res, { message: 'Password reset link sent to student email' });
};

const updateStatus = async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ status: 'error', message: 'isActive must be a boolean' });
  }

  const student = await Student.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!student) return notFound(res, 'Student not found');
  success(res, student);
};

module.exports = { list, getById, resetPassword, updateStatus };
