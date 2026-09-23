// sahlearn-api/src/controllers/admin.dailyQuizzes.controller.js
const mongoose = require('mongoose');
const DailyQuiz = require('../models/DailyQuiz');
const DailyQuizAttempt = require('../models/DailyQuizAttempt');
const { lagosDateKey } = require('../utils/dateKey');
const { success, successList } = require('../utils/apiResponse');

const badId = (res) => res.status(400).json({ status: 'error', message: 'Invalid quiz id' });
const missing = (res) => res.status(404).json({ status: 'error', message: 'Quiz not found' });

const listQuizzes = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);

  const [total, quizzes] = await Promise.all([
    DailyQuiz.countDocuments(),
    DailyQuiz.find().sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  const counts = await DailyQuizAttempt.aggregate([
    { $match: { quiz: { $in: quizzes.map((q) => q._id) }, status: 'submitted' } },
    { $group: { _id: '$quiz', count: { $sum: 1 } } },
  ]);
  const countByQuiz = new Map(counts.map((c) => [String(c._id), c.count]));

  successList(
    res,
    quizzes.map((q) => ({
      id: q._id,
      date: q.date,
      title: q.title,
      questionCount: q.questions.length,
      totalPoints: q.totalPoints,
      isPublished: q.isPublished,
      attemptCount: countByQuiz.get(String(q._id)) || 0,
    })),
    { page, limit, total, totalPages: Math.ceil(total / limit) }
  );
};

const createQuiz = async (req, res) => {
  const date = req.body.date || lagosDateKey();

  if (await DailyQuiz.exists({ date })) {
    return res.status(409).json({ status: 'error', message: `A quiz already exists for ${date}.` });
  }

  const quiz = await DailyQuiz.create({
    date,
    title: req.body.title,
    description: req.body.description,
    questions: req.body.questions,
    isPublished: !!req.body.isPublished,
    publishedAt: req.body.isPublished ? new Date() : undefined,
  });

  success(res, quiz, 201);
};

const getQuiz = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const quiz = await DailyQuiz.findById(req.params.id);
  if (!quiz) return missing(res);
  success(res, quiz);
};

const updateQuiz = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const quiz = await DailyQuiz.findById(req.params.id);
  if (!quiz) return missing(res);

  if (req.body.questions) {
    // Rewriting questions after anyone has been scored would invalidate their
    // recorded score, so it is refused rather than silently accepted.
    const hasAttempts = await DailyQuizAttempt.exists({ quiz: quiz._id, status: 'submitted' });
    if (hasAttempts) {
      return res.status(409).json({
        status: 'error',
        message: 'Students have already taken this quiz, so its questions can no longer be changed.',
      });
    }
    quiz.questions = req.body.questions;
  }

  if (req.body.title !== undefined) quiz.title = req.body.title;
  if (req.body.description !== undefined) quiz.description = req.body.description;
  if (req.body.isPublished !== undefined) {
    quiz.isPublished = req.body.isPublished;
    if (req.body.isPublished && !quiz.publishedAt) quiz.publishedAt = new Date();
  }

  await quiz.save();
  success(res, quiz);
};

const deleteQuiz = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const quiz = await DailyQuiz.findById(req.params.id);
  if (!quiz) return missing(res);

  await DailyQuizAttempt.deleteMany({ quiz: quiz._id });
  await quiz.deleteOne();
  success(res, { deleted: true });
};

const getResults = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const quiz = await DailyQuiz.findById(req.params.id).select('_id').lean();
  if (!quiz) return missing(res);

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 50);
  const filter = { quiz: quiz._id, status: 'submitted' };

  const [total, attempts] = await Promise.all([
    DailyQuizAttempt.countDocuments(filter),
    DailyQuizAttempt.find(filter)
      .sort({ score: -1, durationMs: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student', 'fullName studentId')
      .lean(),
  ]);

  successList(
    res,
    attempts.map((a, i) => ({
      id: a._id,
      rank: (page - 1) * limit + i + 1,
      fullName: a.student?.fullName || '—',
      studentId: a.student?.studentId || '—',
      score: a.score,
      maxScore: a.maxScore,
      durationMs: a.durationMs,
      submittedAt: a.submittedAt,
    })),
    { page, limit, total, totalPages: Math.ceil(total / limit) }
  );
};

module.exports = { listQuizzes, createQuiz, getQuiz, updateQuiz, deleteQuiz, getResults };
