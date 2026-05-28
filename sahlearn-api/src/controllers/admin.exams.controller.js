// sahlearn-api/src/controllers/admin.exams.controller.js
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const { success, successList, notFound } = require('../utils/apiResponse');

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

const createExam = async (req, res) => {
  const { course, title, description, duration, dueDate, isPublished, questions } = req.body;
  const exam = await Exam.create({ course, title, description, duration, dueDate, isPublished, questions: questions || [] });
  success(res, exam, 201);
};

const listExams = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const filter = {};
  if (req.query.course) filter.course = req.query.course;
  if (req.query.isPublished !== undefined) filter.isPublished = req.query.isPublished === 'true';

  const [exams, total] = await Promise.all([
    Exam.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('course', 'title slug')
      .lean(),
    Exam.countDocuments(filter),
  ]);

  const examIds = exams.map((e) => e._id);
  const counts = await ExamAttempt.aggregate([
    { $match: { exam: { $in: examIds } } },
    { $group: { _id: '$exam', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

  const data = exams.map((e) => ({
    ...e,
    attemptCount: countMap[e._id.toString()] || 0,
  }));

  successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
};

const getExam = async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate('course', 'title slug').lean();
  if (!exam) return notFound(res, 'Exam not found');
  success(res, exam);
};

const updateExam = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return notFound(res, 'Exam not found');

  const allowed = ['title', 'description', 'duration', 'dueDate', 'isPublished', 'questions', 'course'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) exam[key] = req.body[key];
  }

  await exam.save();
  success(res, exam);
};

const deleteExam = async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return notFound(res, 'Exam not found');

  await Promise.all([
    exam.deleteOne(),
    ExamAttempt.deleteMany({ exam: exam._id }),
  ]);

  success(res, { message: 'Exam deleted' });
};

const listAttempts = async (req, res) => {
  const exam = await Exam.findById(req.params.id).select('title questions totalPoints').lean();
  if (!exam) return notFound(res, 'Exam not found');

  const attempts = await ExamAttempt.find({ exam: req.params.id })
    .sort({ submittedAt: -1 })
    .populate('student', 'fullName studentId email avatar')
    .lean();

  success(res, { exam, attempts });
};

const reviewAttempt = async (req, res) => {
  const { adminNote, status } = req.body;
  const attempt = await ExamAttempt.findById(req.params.attemptId);
  if (!attempt) return notFound(res, 'Attempt not found');

  if (adminNote !== undefined) attempt.adminNote = adminNote;
  if (status === 'reviewed') {
    attempt.status = 'reviewed';
    attempt.reviewedAt = new Date();
  }
  await attempt.save();

  success(res, attempt);
};

module.exports = { createExam, listExams, getExam, updateExam, deleteExam, listAttempts, reviewAttempt };
