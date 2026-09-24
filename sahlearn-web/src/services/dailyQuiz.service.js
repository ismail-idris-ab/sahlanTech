import api from './api';

const studentHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

export const getTodayQuiz = () =>
  api.get('/api/daily-quiz/today').then((r) => r.data.data);

// { fullName, phone, studentId? } — studentId is optional and only links the
// score to a student dashboard.
export const startQuiz = (payload) =>
  api.post('/api/daily-quiz/start', payload).then((r) => r.data.data);

// POST, not GET: a phone number in a query string ends up in server logs and
// browser history.
export const getScoresByPhone = (phone) =>
  api.post('/api/daily-quiz/my-scores', { phone }).then((r) => r.data.data);

export const submitQuiz = (attemptToken, answers) =>
  api.post('/api/daily-quiz/submit', { attemptToken, answers }).then((r) => r.data.data);

export const getLeaderboard = (date) =>
  api.get('/api/daily-quiz/leaderboard', { params: date ? { date } : {} }).then((r) => r.data.data);

export const getMyQuizHistory = ({ page = 1, limit = 20 } = {}) =>
  api
    .get('/api/student/daily-quiz/history', { params: { page, limit }, headers: studentHeader() })
    .then((r) => ({ data: r.data.data, meta: r.data.meta, stats: r.data.stats }));

export const formatDuration = (ms) => {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
};
