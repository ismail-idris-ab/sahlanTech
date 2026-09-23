// sahlearn-api/src/controllers/dailyQuiz.controller.js
// Public, unauthenticated daily quiz endpoints. Nothing here may return
// correctIndex except the submit result.
const DailyQuiz = require('../models/DailyQuiz');
const DailyQuizAttempt = require('../models/DailyQuizAttempt');
const Student = require('../models/Student');
const { lagosDateKey } = require('../utils/dateKey');
const { success } = require('../utils/apiResponse');
const { signAttemptToken, verifyAttemptToken, hashIp } = require('../utils/attemptToken');
const { scoreQuiz } = require('../utils/scoreQuiz');

const findTodaysQuiz = () => DailyQuiz.findOne({ date: lagosDateKey(), isPublished: true });

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const LEADERBOARD_SIZE = 20;

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

  // Checked before looking up the student: otherwise, on any day with no
  // published quiz, this endpoint would still distinguish real student IDs
  // from fake ones by which 404 message it returns — a 24/7 enumeration
  // oracle rather than one that only exists on quiz days.
  const quiz = await findTodaysQuiz();
  if (!quiz) {
    return res.status(404).json({ status: 'error', message: 'There is no quiz today. Check back tomorrow.' });
  }

  const student = await Student.findOne({ studentId: studentId.trim() });
  // Same message for unknown and inactive, so this cannot be used to confirm
  // which IDs exist.
  if (!student || !student.isActive) {
    return res.status(404).json({ status: 'error', message: 'We could not find that student ID.' });
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

/* ── POST /api/daily-quiz/submit ── */
const submitAttempt = async (req, res) => {
  const payload = verifyAttemptToken(req.body.attemptToken);
  if (!payload) {
    return res.status(401).json({ status: 'error', message: 'Your quiz session has expired. Start again.' });
  }

  const attempt = await DailyQuizAttempt.findById(payload.attemptId);
  if (!attempt) {
    return res.status(404).json({ status: 'error', message: 'Attempt not found.' });
  }
  if (attempt.status === 'submitted') {
    return res.status(409).json({ status: 'error', message: 'This attempt was already submitted.' });
  }

  // Re-check the student: /start validated them, but that was up to 3 hours ago.
  const student = await Student.findById(attempt.student);
  if (!student || !student.isActive) {
    return res.status(403).json({ status: 'error', message: 'This account can no longer take the quiz.' });
  }

  // Score against the attempt's own quiz, never "today's" — a token can cross
  // midnight Lagos.
  const quiz = await DailyQuiz.findById(attempt.quiz);
  if (!quiz) {
    return res.status(404).json({ status: 'error', message: 'This quiz is no longer available.' });
  }

  const { score, maxScore, results } = scoreQuiz(quiz.questions, req.body.answers);

  const submittedAt = new Date();
  attempt.answers = results.map((r) => ({
    questionIndex: r.questionIndex,
    selectedIndex: r.selectedIndex,
  }));
  attempt.score = score;
  attempt.maxScore = maxScore;
  attempt.submittedAt = submittedAt;
  // Computed from the stored startedAt. Anything the client sent is ignored.
  attempt.durationMs = submittedAt.getTime() - attempt.startedAt.getTime();
  attempt.status = 'submitted';
  await attempt.save();

  success(res, {
    date: attempt.quizDate,
    score,
    maxScore,
    durationMs: attempt.durationMs,
    submittedAt: submittedAt.toISOString(),
    results,
  });
};

/* ── GET /api/daily-quiz/leaderboard ── */
const getLeaderboard = async (req, res) => {
  const requested = (req.query.date || '').trim();
  // A junk date is not an error — it is simply a day with no board.
  const date = DATE_KEY.test(requested) ? requested : requested ? null : lagosDateKey();

  if (!date) {
    return success(res, { date: requested, entries: [] });
  }

  // Only published quizzes have a public board. An admin unpublishing a day
  // pulls it off the board without touching the recorded attempts.
  const quiz = await DailyQuiz.findOne({ date, isPublished: true }).select('_id').lean();
  if (!quiz) return success(res, { date, entries: [] });

  const attempts = await DailyQuizAttempt.find({ quizDate: date, status: 'submitted' })
    .sort({ score: -1, durationMs: 1 })
    .limit(LEADERBOARD_SIZE)
    .populate('student', 'fullName')
    .select('score maxScore durationMs student')
    .lean();

  success(res, {
    date,
    entries: attempts.map((a, i) => ({
      rank: i + 1,
      fullName: a.student?.fullName || 'Student',
      score: a.score,
      maxScore: a.maxScore,
      durationMs: a.durationMs,
    })),
  });
};

module.exports = { getToday, startAttempt, submitAttempt, getLeaderboard, findTodaysQuiz, publicQuestions };
