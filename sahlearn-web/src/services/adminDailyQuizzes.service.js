import api from './api';

const adminHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_token')}`,
});

export const listDailyQuizzes = ({ page = 1, limit = 20 } = {}) =>
  api
    .get('/api/admin/daily-quizzes', { params: { page, limit }, headers: adminHeader() })
    .then((r) => ({ data: r.data.data, meta: r.data.meta }));

export const createDailyQuiz = (payload) =>
  api.post('/api/admin/daily-quizzes', payload, { headers: adminHeader() }).then((r) => r.data.data);

export const getDailyQuiz = (id) =>
  api.get(`/api/admin/daily-quizzes/${id}`, { headers: adminHeader() }).then((r) => r.data.data);

export const updateDailyQuiz = (id, payload) =>
  api.patch(`/api/admin/daily-quizzes/${id}`, payload, { headers: adminHeader() }).then((r) => r.data.data);

export const deleteDailyQuiz = (id) =>
  api.delete(`/api/admin/daily-quizzes/${id}`, { headers: adminHeader() });

export const getDailyQuizResults = (id, { page = 1, limit = 50 } = {}) =>
  api
    .get(`/api/admin/daily-quizzes/${id}/results`, { params: { page, limit }, headers: adminHeader() })
    .then((r) => ({ data: r.data.data, meta: r.data.meta }));

export const getDailyQuizAttempt = (quizId, attemptId) =>
  api
    .get(`/api/admin/daily-quizzes/${quizId}/attempts/${attemptId}`, { headers: adminHeader() })
    .then((r) => r.data.data);

// grades: [{ questionIndex, awardedPoints }] — essay questions only.
export const gradeDailyQuizAttempt = (quizId, attemptId, grades) =>
  api
    .patch(
      `/api/admin/daily-quizzes/${quizId}/attempts/${attemptId}/grades`,
      { grades },
      { headers: adminHeader() }
    )
    .then((r) => r.data.data);
