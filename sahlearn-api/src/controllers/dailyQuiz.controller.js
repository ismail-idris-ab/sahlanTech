// sahlearn-api/src/controllers/dailyQuiz.controller.js
// Public, unauthenticated daily quiz endpoints. Nothing here may return
// correctIndex except the submit result.
const DailyQuiz = require('../models/DailyQuiz');
const DailyQuizAttempt = require('../models/DailyQuizAttempt');
const Student = require('../models/Student');
const { lagosDateKey } = require('../utils/dateKey');
const { success } = require('../utils/apiResponse');
const { signAttemptToken, verifyAttemptToken, hashIp } = require('../utils/attemptToken');
const { phoneKey, maskPhone } = require('../utils/phone');
const { scoreQuiz } = require('../utils/scoreQuiz');

const findTodaysQuiz = () => DailyQuiz.findOne({ date: lagosDateKey(), isPublished: true });

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const LEADERBOARD_SIZE = 20;

// The one place questions are shaped for a client. Never add correctIndex here.
const publicQuestions = (quiz) =>
  quiz.questions.map((q) => ({
    id: String(q._id),
    type: q.type || 'mcq',
    text: q.text,
    options: q.type === 'essay' ? [] : q.options,
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
    essayCount: quiz.questions.filter((q) => q.type === 'essay').length,
    totalPoints: quiz.totalPoints,
  });
};

/* ── POST /api/daily-quiz/start ── */
// Open to anyone: name and phone identify the taker, and an optional student ID
// links the score to a dashboard. The phone is the identity key either way.
const startAttempt = async (req, res) => {
  const { fullName, phone, studentId } = req.body;

  // Checked before any lookup: otherwise, on any day with no published quiz,
  // this endpoint would still distinguish real student IDs from fake ones by
  // which 404 message it returns — a 24/7 enumeration oracle rather than one
  // that only exists on quiz days.
  const quiz = await findTodaysQuiz();
  if (!quiz) {
    return res.status(404).json({ status: 'error', message: 'There is no quiz today. Check back tomorrow.' });
  }

  const key = phoneKey(phone);
  if (!key) {
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors: [{ field: 'phone', message: 'Enter a valid Nigerian phone number, e.g. 08012345678' }],
    });
  }

  // A student ID is optional, but a WRONG one is refused rather than quietly
  // treated as a guest — otherwise a typo costs the student their dashboard
  // credit with nothing on screen to explain why.
  let student = null;
  const trimmedId = typeof studentId === 'string' ? studentId.trim() : '';
  if (trimmedId) {
    student = await Student.findOne({ studentId: trimmedId });
    if (!student || !student.isActive) {
      return res.status(404).json({
        status: 'error',
        message: 'We could not find that student ID. Leave it blank to take the quiz as a guest.',
      });
    }
  }

  // Keyed on the phone, so one person cannot take it twice by adding or
  // dropping their student ID the second time.
  const existing = await DailyQuizAttempt.findOne({
    quizDate: quiz.date,
    'participant.phoneKey': key,
  });

  if (existing?.status === 'submitted') {
    return res.status(409).json({
      status: 'error',
      message: "You already took today's quiz.",
      data: {
        score: existing.score,
        maxScore: existing.maxScore,
        pendingEssays: existing.pendingEssays || 0,
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
      student: student ? student._id : null,
      participant: { fullName: fullName.trim(), phone: phone.trim(), phoneKey: key },
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
  // Only applies to attempts linked to an account — a guest has none to check.
  if (attempt.student) {
    const student = await Student.findById(attempt.student);
    if (!student || !student.isActive) {
      return res.status(403).json({ status: 'error', message: 'This account can no longer take the quiz.' });
    }
  }

  // Score against the attempt's own quiz, never "today's" — a token can cross
  // midnight Lagos.
  const quiz = await DailyQuiz.findById(attempt.quiz);
  if (!quiz) {
    return res.status(404).json({ status: 'error', message: 'This quiz is no longer available.' });
  }

  const { score, maxScore, pendingEssays, results } = scoreQuiz(quiz.questions, req.body.answers);

  const submittedAt = new Date();
  attempt.answers = results.map((r) => ({
    questionIndex: r.questionIndex,
    selectedIndex: r.type === 'essay' ? undefined : r.selectedIndex,
    text: r.type === 'essay' ? r.text : undefined,
    awardedPoints: r.awardedPoints,
    graded: r.graded,
  }));
  attempt.score = score;
  attempt.maxScore = maxScore;
  attempt.pendingEssays = pendingEssays;
  attempt.submittedAt = submittedAt;
  // Computed from the stored startedAt. Anything the client sent is ignored.
  attempt.durationMs = submittedAt.getTime() - attempt.startedAt.getTime();
  attempt.status = 'submitted';
  await attempt.save();

  success(res, {
    date: attempt.quizDate,
    score,
    maxScore,
    pendingEssays,
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
    .select('score maxScore durationMs pendingEssays student participant')
    .lean();

  success(res, {
    date,
    entries: attempts.map((a, i) => ({
      rank: i + 1,
      // The name they gave wins: it is what they typed on the day. Attempts
      // recorded before the quiz opened up have only the linked student.
      fullName: a.participant?.fullName || a.student?.fullName || 'Student',
      // Masked, never the full number — it only exists to tell two people with
      // the same name apart. Empty for pre-existing attempts with no phone.
      maskedPhone: maskPhone(a.participant?.phoneKey),
      isStudent: !!a.student,
      score: a.score,
      maxScore: a.maxScore,
      durationMs: a.durationMs,
      // This row can still move: essays on it are not marked yet. The client
      // labels it so a student does not read a provisional rank as final.
      pending: (a.pendingEssays || 0) > 0,
    })),
  });
};

/* ── POST /api/daily-quiz/my-scores ── */
// Lets someone with no account see their own past results.
//
// POST rather than GET on purpose: a phone number in a query string ends up in
// server logs, browser history and Referer headers. Three further guards:
//   - an unknown number returns exactly what a known number with no attempts
//     returns, so this cannot be used to test which numbers are in the database
//   - no name is returned, so it never confirms whose number it is
//   - it is rate limited per IP like the rest of the public quiz surface
// What it does return is already public on the leaderboard for the same day.
const MY_SCORES_LIMIT = 30;

const getMyScoresByPhone = async (req, res) => {
  const key = phoneKey(req.body.phone);
  if (!key) {
    return res.status(422).json({
      status: 'error',
      message: 'Validation failed',
      errors: [{ field: 'phone', message: 'Enter a valid Nigerian phone number, e.g. 08012345678' }],
    });
  }

  const attempts = await DailyQuizAttempt.find({
    'participant.phoneKey': key,
    status: 'submitted',
  })
    .sort({ quizDate: -1 })
    .limit(MY_SCORES_LIMIT)
    .populate('quiz', 'title')
    .select('quizDate score maxScore durationMs submittedAt pendingEssays quiz')
    .lean();

  success(res, {
    entries: attempts.map((a) => ({
      date: a.quizDate,
      title: a.quiz?.title || 'Daily quiz',
      score: a.score,
      maxScore: a.maxScore,
      durationMs: a.durationMs,
      pendingEssays: a.pendingEssays || 0,
      submittedAt: a.submittedAt,
    })),
  });
};

module.exports = {
  getToday,
  startAttempt,
  submitAttempt,
  getLeaderboard,
  getMyScoresByPhone,
  findTodaysQuiz,
  publicQuestions,
};
