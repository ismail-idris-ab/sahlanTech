import api from './api';

export const getExams = async ({ page = 1, limit = 20, course, isPublished } = {}) => {
  const params = { page, limit };
  if (course) params.course = course;
  if (isPublished !== undefined) params.isPublished = isPublished;
  const { data } = await api.get('/api/admin/exams', { params });
  return data; // { status, data[], meta }
};

export const createExam = async (payload) => {
  const { data } = await api.post('/api/admin/exams', payload);
  return data.data;
};

export const getExam = async (id) => {
  const { data } = await api.get(`/api/admin/exams/${id}`);
  return data.data;
};

export const updateExam = async (id, payload) => {
  const { data } = await api.patch(`/api/admin/exams/${id}`, payload);
  return data.data;
};

export const deleteExam = async (id) => {
  const { data } = await api.delete(`/api/admin/exams/${id}`);
  return data.data;
};

export const listAttempts = async (id) => {
  const { data } = await api.get(`/api/admin/exams/${id}/attempts`);
  return data.data; // { exam, attempts[] }
};

export const reviewAttempt = async (attemptId, payload) => {
  const { data } = await api.patch(`/api/admin/exams/attempts/${attemptId}`, payload);
  return data.data;
};
