import api from './api';

export const getStudents = async ({ page = 1, limit = 20, search = '', isActive } = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (isActive !== undefined) params.isActive = isActive;
  const { data } = await api.get('/api/admin/students', { params });
  return data; // { status, data, meta }
};

export const getStudentById = async (id) => {
  const { data } = await api.get(`/api/admin/students/${id}`);
  return data.data;
};

export const triggerPasswordReset = async (id) => {
  const { data } = await api.post(`/api/admin/students/${id}/reset-password`);
  return data.data;
};

export const toggleStudentStatus = async (id, isActive) => {
  const { data } = await api.patch(`/api/admin/students/${id}/status`, { isActive });
  return data.data;
};

export const getStudentProgress = async (id) => {
  const { data } = await api.get(`/api/admin/students/${id}/progress`);
  return data.data; // CourseGroup[]
};

export const impersonateStudent = async (id) => {
  const { data } = await api.post(`/api/admin/students/${id}/impersonate`);
  return data.data;
};

export const deleteStudent = async (id) =>
  api.delete(`/api/admin/students/${id}`);

export const deleteStudents = async (ids) =>
  api.delete('/api/admin/students', { data: { ids } });
