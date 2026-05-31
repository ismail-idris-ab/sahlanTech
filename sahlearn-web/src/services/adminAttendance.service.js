import api from './api';

export const getSessions = async ({ page = 1, limit = 20, course } = {}) => {
  const params = { page, limit };
  if (course) params.course = course;
  const { data } = await api.get('/api/admin/attendance/sessions', { params });
  return data; // { status, data[], meta }
};

export const createSession = async (payload) => {
  const { data } = await api.post('/api/admin/attendance/sessions', payload);
  return data.data;
};

export const getSession = async (id) => {
  const { data } = await api.get(`/api/admin/attendance/sessions/${id}`);
  return data.data; // { session, roster[] }
};

export const updateSession = async (id, payload) => {
  const { data } = await api.patch(`/api/admin/attendance/sessions/${id}`, payload);
  return data.data;
};

export const deleteSession = async (id) => {
  const { data } = await api.delete(`/api/admin/attendance/sessions/${id}`);
  return data.data;
};

export const saveRecords = async (id, records) => {
  const { data } = await api.put(`/api/admin/attendance/sessions/${id}/records`, { records });
  return data.data;
};

export const getStudentAttendance = async (studentId) => {
  const { data } = await api.get(`/api/admin/students/${studentId}/attendance`);
  return data.data;
};
