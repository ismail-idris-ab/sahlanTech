// sahlearn-api/src/controllers/admin.dailyQuizzes.controller.js
const mongoose = require('mongoose');
const DailyQuiz = require('../models/DailyQuiz');
const DailyQuizAttempt = require('../models/DailyQuizAttempt');
const { lagosDateKey } = require('../utils/dateKey');
const { success, successList } = require('../utils/apiResponse');
const { totalAwarded, countPendingEssays } = require('../utils/scoreQuiz');

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
      pendingEssays: a.pendingEssays || 0,
    })),
    { page, limit, total, totalPages: Math.ceil(total / limit) }
  );
};

/* ── GET /api/admin/daily-quizzes/:id/attempts/:attemptId ── */
// One student's attempt, question by question, for the grading screen. Admin
// only, so unlike every public endpoint this one DOES carry correctIndex.
const getAttempt = async (req, res) => {
  const { id, attemptId } = req.params;
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(attemptId)) return badId(res);

  const quiz = await DailyQuiz.findById(id).lean();
  if (!quiz) return missing(res);

  const attempt = await DailyQuizAttempt.findOne({ _id: attemptId, quiz: quiz._id })
    .populate('student', 'fullName studentId')
    .lean();
  if (!attempt) {
    return res.status(404).json({ status: 'error', message: 'Attempt not found' });
  }

  const byIndex = new Map((attempt.answers || []).map((a) => [a.questionIndex, a]));

  success(res, {
    id: attempt._id,
    quizId: quiz._id,
    quizTitle: quiz.title,
    date: attempt.quizDate,
    fullName: attempt.student?.fullName || '—',
    studentId: attempt.student?.studentId || '—',
    score: attempt.score,
    maxScore: attempt.maxScore,
    durationMs: attempt.durationMs,
    submittedAt: attempt.submittedAt,
    pendingEssays: attempt.pendingEssays || 0,
    questions: quiz.questions.map((q, questionIndex) => {
      const a = byIndex.get(questionIndex);
      const type = q.type || 'mcq';
      return {
        questionIndex,
        type,
        text: q.text,
        points: q.points || 1,
        options: type === 'essay' ? [] : q.options,
        correctIndex: type === 'essay' ? null : q.correctIndex,
        selectedIndex: a?.selectedIndex ?? null,
        answerText: a?.text || '',
        awardedPoints: a?.awardedPoints ?? null,
        graded: !!a?.graded,
      };
    }),
  });
};

/* ── PATCH /api/admin/daily-quizzes/:id/attempts/:attemptId/grades ── */
const gradeAttempt = async (req, res) => {
  const { id, attemptId } = req.params;
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(attemptId)) return badId(res);

  const quiz = await DailyQuiz.findById(id).lean();
  if (!quiz) return missing(res);

  const attempt = await DailyQuizAttempt.findOne({ _id: attemptId, quiz: quiz._id });
  if (!attempt) {
    return res.status(404).json({ status: 'error', message: 'Attempt not found' });
  }
  if (attempt.status !== 'submitted') {
    return res.status(409).json({ status: 'error', message: 'This attempt has not been submitted yet.' });
  }

  // Validate every mark before writing any of them, so a bad third mark cannot
  // leave the first two applied.
  const errors = [];
  for (const { questionIndex, awardedPoints } of req.body.grades) {
    const question = quiz.questions[questionIndex];
    if (!question) {
      errors.push({ field: `grades.${questionIndex}`, message: `Question ${questionIndex + 1} is not part of this quiz` });
      continue;
    }
    if ((question.type || 'mcq') !== 'essay') {
      errors.push({
        field: `grades.${questionIndex}`,
        message: `Question ${questionIndex + 1} is multiple choice and is marked automatically`,
      });
      continue;
    }
    const max = question.points || 1;
    if (awardedPoints > max) {
      errors.push({
        field: `grades.${questionIndex}`,
        message: `Question ${questionIndex + 1} is worth at most ${max} point${max === 1 ? '' : 's'}`,
      });
    }
  }

  if (errors.length) {
    return res.status(422).json({ status: 'error', message: 'Validation failed', errors });
  }

  for (const { questionIndex, awardedPoints } of req.body.grades) {
    let answer = attempt.answers.find((a) => a.questionIndex === questionIndex);
    if (!answer) {
      // The student skipped this essay outright, so no answer row was written.
      // Marking it still has to be possible — usually to zero.
      attempt.answers.push({ questionIndex, text: '', awardedPoints, graded: true });
      continue;
    }
    answer.awardedPoints = awardedPoints;
    answer.graded = true;
  }

  // Recomputed from what is actually recorded rather than incremented, so
  // re-marking a question cannot drift the total.
  attempt.score = totalAwarded(attempt.answers);
  attempt.pendingEssays = countPendingEssays(attempt.answers);
  await attempt.save();

  success(res, {
    id: attempt._id,
    score: attempt.score,
    maxScore: attempt.maxScore,
    pendingEssays: attempt.pendingEssays,
  });
};

module.exports = {
  listQuizzes,
  createQuiz,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  getResults,
  getAttempt,
  gradeAttempt,
};
