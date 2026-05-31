// sahlearn-api/src/controllers/student.controller.js
const cloudinary = require('../config/cloudinary');
const Student = require('../models/Student');
const Submission = require('../models/Submission');
const ExamAttempt = require('../models/ExamAttempt');
const Assignment = require('../models/Assignment');
const { success } = require('../utils/apiResponse');

const getMe = async (req, res) => {
  const student = await Student.findById(req.student._id).populate('enrolledCourses.course', 'title slug coverImage category');
  success(res, student);
};

const updateMe = async (req, res) => {
  const allowed = ['fullName', 'phone', 'dateOfBirth', 'address', 'bio', 'academicLevel'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined && req.body[key] !== '') updates[key] = req.body[key];
  }

  const student = await Student.findByIdAndUpdate(req.student._id, updates, { new: true, runValidators: true });
  success(res, student);
};

const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }

  const student = await Student.findById(req.student._id);

  // Delete old avatar from Cloudinary if exists
  if (student.avatar?.public_id) {
    await cloudinary.uploader.destroy(student.avatar.public_id).catch(() => {});
  }

  student.avatar = { url: req.file.path, public_id: req.file.filename };
  await student.save();

  success(res, { avatar: student.avatar });
};

const deleteAvatar = async (req, res) => {
  const student = await Student.findById(req.student._id);

  if (student.avatar?.public_id) {
    await cloudinary.uploader.destroy(student.avatar.public_id).catch(() => {});
  }

  student.avatar = undefined;
  await student.save();

  success(res, { message: 'Avatar removed' });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const student = await Student.findById(req.student._id).select('+password');
  const match = await student.comparePassword(currentPassword);
  if (!match) {
    return res.status(400).json({ status: 'error', message: 'Current password is incorrect' });
  }

  student.password = newPassword;
  student.tempPassword = undefined;
  student.mustChangePassword = false;
  await student.save();

  success(res, { message: 'Password changed successfully' });
};

// First-login forced password set — no current password required (already authenticated)
const setFirstPassword = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(422).json({ status: 'error', message: 'Password must be at least 8 characters.' });
  }

  const bcrypt = require('bcryptjs');
  const hashed = await bcrypt.hash(password, 10);

  await Student.findByIdAndUpdate(req.student._id, {
    $set: { password: hashed, mustChangePassword: false },
    $unset: { tempPassword: 1 },
  });

  success(res, { message: 'Password set successfully' });
};

const getStats = async (req, res) => {
  const studentId = req.student._id;
  const courseIds = req.student.enrolledCourses.map((ec) => ec.course);

  const [totalAssignments, submittedCount, examsTaken, avgScoreResult] = await Promise.all([
    Assignment.countDocuments({ course: { $in: courseIds }, isPublished: true }),
    Submission.countDocuments({ student: studentId }),
    ExamAttempt.countDocuments({ student: studentId }),
    ExamAttempt.aggregate([
      { $match: { student: studentId, maxScore: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avg: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } },
        },
      },
    ]),
  ]);

  const avgScore = avgScoreResult[0] ? Math.round(avgScoreResult[0].avg) : null;

  success(res, {
    assignments: {
      total: totalAssignments,
      submitted: submittedCount,
      pending: Math.max(0, totalAssignments - submittedCount),
    },
    exams: {
      taken: examsTaken,
      avgScore,
    },
  });
};

const getProgress = async (req, res) => {
  const studentId = req.student._id;
  const enrolledCourses = req.student.enrolledCourses.filter((ec) => ec.course);
  const courseIds = enrolledCourses.map((ec) => ec.course);

  const [attempts, submissions] = await Promise.all([
    ExamAttempt.find({ student: studentId })
      .populate({ path: 'exam', select: 'title totalPoints course', populate: { path: 'course', select: 'title _id' } })
      .lean(),
    Submission.find({ student: studentId })
      .populate({ path: 'assignment', select: 'title totalPoints course', populate: { path: 'course', select: 'title _id' } })
      .lean(),
  ]);

  // Group by course
  const courseMap = {};

  const ensureCourse = (courseDoc) => {
    if (!courseDoc) return;
    const id = courseDoc._id.toString();
    if (!courseMap[id]) {
      courseMap[id] = { courseId: id, courseTitle: courseDoc.title, exams: [], assignments: [] };
    }
    return id;
  };

  for (const attempt of attempts) {
    const courseDoc = attempt.exam?.course;
    const id = ensureCourse(courseDoc);
    if (!id) continue;
    courseMap[id].exams.push({
      examId: attempt.exam?._id,
      title: attempt.exam?.title,
      score: attempt.score,
      maxScore: attempt.maxScore,
      mcqScore: attempt.mcqScore,
      status: attempt.status,
      isPendingEssayReview: attempt.status === 'submitted',
      submittedAt: attempt.submittedAt,
    });
  }

  for (const sub of submissions) {
    const courseDoc = sub.assignment?.course;
    const id = ensureCourse(courseDoc);
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

  // Ensure enrolled courses with no activity still appear
  for (const ec of enrolledCourses) {
    const id = ec.course.toString();
    if (!courseMap[id]) {
      courseMap[id] = { courseId: id, courseTitle: null, exams: [], assignments: [] };
    }
  }

  const data = Object.values(courseMap);
  success(res, data);
};

module.exports = { getMe, updateMe, uploadAvatar, deleteAvatar, changePassword, setFirstPassword, getStats, getProgress };
