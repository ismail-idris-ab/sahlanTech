// sahlearn-api/src/controllers/dailyQuiz.controller.js
// Public, unauthenticated daily quiz endpoints. Nothing here may return
// correctIndex except the submit result.
const DailyQuiz = require('../models/DailyQuiz');
const { lagosDateKey } = require('../utils/dateKey');
const { success } = require('../utils/apiResponse');

const findTodaysQuiz = () => DailyQuiz.findOne({ date: lagosDateKey(), isPublished: true });

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

module.exports = { getToday, findTodaysQuiz };
