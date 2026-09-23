// sahlearn-api/src/controllers/dailyQuiz.controller.js
// Public, unauthenticated daily quiz endpoints. Nothing here may return
// correctIndex except the submit result.
const DailyQuiz = require('../models/DailyQuiz');
const DailyQuizAttempt = require('../models/DailyQuizAttempt');
const Student = require('../models/Student');
const { lagosDateKey } = require('../utils/dateKey');
const { success } = require('../utils/apiResponse');
const { signAttemptToken, hashIp } = require('../utils/attemptToken');

const findTodaysQuiz = () => DailyQuiz.findOne({ date: lagosDateKey(), isPublished: true });

// The one place questions are shaped for a client. Never add correctIndex here.
const publicQuestions = (quiz) =>
  quiz.questions.map((q) => ({
    id: String(q._id),
    text: q.text,
    options: q.options,
    points: q.points,
  }));

/* ── GET /api/daily-quiz/today ── */
const getToday = async (_req, res) => {
  const quiz = await findTodaysQuiz().lean();
  if (!quiz) return success(res, { available: false });

  success(res, {
    available: true,
    date: quiz.date,
    title: quiz.title,
    description: quiz.description || '',
    questionCount: quiz.questions.length,
    totalPoints: quiz.totalPoints,
  });
};

/* ── POST /api/daily-quiz/start ── */
const startAttempt = async (req, res) => {
  const { studentId } = req.body;

  const student = await Student.findOne({ studentId: studentId.trim() });
  // Same message for unknown and inactive, so this cannot be used to confirm
  // which IDs exist.
  if (!student || !student.isActive) {
    return res.status(404).json({ status: 'error', message: 'We could not find that student ID.' });
  }

  const quiz = await findTodaysQuiz();
  if (!quiz) {
    return res.status(404).json({ status: 'error', message: 'There is no quiz today. Check back tomorrow.' });
  }

  const existing = await DailyQuizAttempt.findOne({ quizDate: quiz.date, student: student._id });

  if (existing?.status === 'submitted') {
    return res.status(409).json({
      status: 'error',
      message: "You already took today's quiz.",
      data: {
        score: existing.score,
        maxScore: existing.maxScore,
        durationMs: existing.durationMs,
        submittedAt: existing.submittedAt,
      },
    });
  }

  // Resuming: keep the original startedAt so a refresh cannot reset the clock.
  const attempt =
    existing ||
    (await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
      maxScore: quiz.totalPoints,
      ipHash: hashIp(req.ip),
    }));

  success(
    res,
    {
      attemptToken: signAttemptToken(attempt._id),
      date: quiz.date,
      title: quiz.title,
      description: quiz.description || '',
      startedAt: attempt.startedAt.toISOString(),
      questions: publicQuestions(quiz),
    },
    existing ? 200 : 201
  );
};

module.exports = { getToday, startAttempt, findTodaysQuiz, publicQuestions };
