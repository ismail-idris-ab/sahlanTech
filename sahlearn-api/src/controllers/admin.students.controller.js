// sahlearn-api/src/controllers/admin.students.controller.js
const crypto = require('crypto');
const Student = require('../models/Student');
const ExamAttempt = require('../models/ExamAttempt');
const Submission = require('../models/Submission');
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

const getStudentProgress = async (req, res) => {
  const student = await Student.findById(req.params.id).select('enrolledCourses').populate('enrolledCourses.course', 'title');
  if (!student) return notFound(res, 'Student not found');

  const studentId = student._id;

  const [attempts, submissions] = await Promise.all([
    ExamAttempt.find({ student: studentId })
      .populate({ path: 'exam', select: 'title totalPoints course', populate: { path: 'course', select: 'title _id' } })
      .lean(),
    Submission.find({ student: studentId })
      .populate({ path: 'assignment', select: 'title totalPoints course', populate: { path: 'course', select: 'title _id' } })
      .lean(),
  ]);

  const courseMap = {};

  const ensureCourse = (courseDoc) => {
    if (!courseDoc) return null;
    const id = courseDoc._id.toString();
    if (!courseMap[id]) courseMap[id] = { courseId: id, courseTitle: courseDoc.title, exams: [], assignments: [] };
    return id;
  };

  for (const attempt of attempts) {
    const id = ensureCourse(attempt.exam?.course);
    if (!id) continue;
    courseMap[id].exams.push({
      examId: attempt.exam?._id,
      title: attempt.exam?.title,
      score: attempt.score,
      mcqScore: attempt.mcqScore,
      maxScore: attempt.maxScore,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
    });
  }

  for (const sub of submissions) {
    const id = ensureCourse(sub.assignment?.course);
    if (!id) continue;
    courseMap[id].assignments.push({
      assignmentId: sub.assignment?._id,
      title: sub.assignment?.title,
      score: sub.score,
      maxScore: sub.maxScore || sub.assignment?.totalPoints || 100,
      status: sub.status,
      feedback: sub.feedback,
      submittedAt: sub.submittedAt,
    });
  }

  // Include enrolled courses even with no activity
  for (const ec of student.enrolledCourses) {
    if (!ec.course) continue;
    const id = ec.course._id.toString();
    if (!courseMap[id]) courseMap[id] = { courseId: id, courseTitle: ec.course.title, exams: [], assignments: [] };
  }

  success(res, Object.values(courseMap));
};

const impersonateStudent = async (req, res) => {
  const jwt = require('jsonwebtoken');
  const student = await Student.findById(req.params.id);
  if (!student) return notFound(res, 'Student not found');
  if (!student.isActive) return res.status(403).json({ status: 'error', message: 'Student account is inactive' });
  const token = jwt.sign(
    { id: student._id, role: 'student' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  success(res, { token, student: { fullName: student.fullName, studentId: student.studentId } });
};

const deleteStudent = async (req, res) => {
  const Student = require('../models/Student');
  await Student.findByIdAndDelete(req.params.id);
  success(res, { deleted: true });
};

const deleteStudents = async (req, res) => {
  const Student = require('../models/Student');
  const { ids } = req.body;
  const filter = Array.isArray(ids) && ids.length ? { _id: { $in: ids } } : {};
  const result = await Student.deleteMany(filter);
  success(res, { deleted: result.deletedCount });
};

module.exports = { list, getById, resetPassword, updateStatus, getStudentProgress, impersonateStudent, deleteStudent, deleteStudents };
