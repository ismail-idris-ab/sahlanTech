// sahlearn-api/src/controllers/student.dailyQuiz.controller.js
const DailyQuizAttempt = require('../models/DailyQuizAttempt');
const { lagosDateKey } = require('../utils/dateKey');
const { currentStreak } = require('../utils/streak');

/* ── GET /api/student/daily-quiz/history ── */
const getMyHistory = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const filter = { student: req.student._id, status: 'submitted' };

  const [total, attempts, allDates, aggregate] = await Promise.all([
    DailyQuizAttempt.countDocuments(filter),
    DailyQuizAttempt.find(filter)
      .sort({ quizDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('quiz', 'title')
      .select('quizDate score maxScore durationMs submittedAt pendingEssays quiz')
      .lean(),
    DailyQuizAttempt.find(filter).select('quizDate').lean(),
    // Stats cover every attempt, not just this page.
    DailyQuizAttempt.aggregate([
      { $match: filter },
      { $group: { _id: null, avg: { $avg: '$score' }, best: { $max: '$score' } } },
    ]),
  ]);

  const stats = {
    totalTaken: total,
    averageScore: total ? Math.round((aggregate[0]?.avg || 0) * 10) / 10 : 0,
    bestScore: aggregate[0]?.best || 0,
    currentStreak: currentStreak(allDates.map((a) => a.quizDate), lagosDateKey()),
  };

  res.status(200).json({
    status: 'success',
    data: attempts.map((a) => ({
      id: a._id,
      date: a.quizDate,
      title: a.quiz?.title || 'Daily quiz',
      score: a.score,
      maxScore: a.maxScore,
      durationMs: a.durationMs,
      submittedAt: a.submittedAt,
      // > 0 means this row's score is provisional: the teacher has not finished
      // marking its written answers.
      pendingEssays: a.pendingEssays || 0,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats,
  });
};

module.exports = { getMyHistory };
