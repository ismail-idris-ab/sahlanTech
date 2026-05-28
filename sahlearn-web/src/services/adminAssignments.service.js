import api from './api';

export const getAssignments = async ({ page = 1, limit = 20, courseId } = {}) => {
  const params = { page, limit };
  if (courseId) params.courseId = courseId;
  const { data } = await api.get('/api/admin/assignments', { params });
  return data; // { status, data, meta }
};

export const createAssignment = async (payload) => {
  const { data } = await api.post('/api/admin/assignments', payload);
  return data.data;
};

export const getAssignment = async (id) => {
  const { data } = await api.get(`/api/admin/assignments/${id}`);
  return data.data;
};

export const updateAssignment = async (id, payload) => {
  const { data } = await api.patch(`/api/admin/assignments/${id}`, payload);
  return data.data;
};

export const deleteAssignment = async (id) => {
  const { data } = await api.delete(`/api/admin/assignments/${id}`);
  return data.data;
};

export const listSubmissions = async (id) => {
  const { data } = await api.get(`/api/admin/assignments/${id}/submissions`);
  return data.data; // { assignment, submissions[] }
};

export const gradeSubmission = async (submissionId, payload) => {
  const { data } = await api.patch(`/api/admin/assignments/submissions/${submissionId}`, payload);
  return data.data;
};
