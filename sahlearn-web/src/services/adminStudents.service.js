import api from './api';

export const getStudents = async ({ page = 1, limit = 20, search = '', isActive } = {}) => {
  const params = { page, limit };
  if (search) params.search = search;
  if (isActive !== undefined) params.isActive = isActive;
  const { data } = await api.get('/admin/students', { params });
  return data; // { status, data, meta }
};

export const getStudentById = async (id) => {
  const { data } = await api.get(`/admin/students/${id}`);
  return data.data;
};

export const triggerPasswordReset = async (id) => {
  const { data } = await api.post(`/admin/students/${id}/reset-password`);
  return data.data;
};

export const toggleStudentStatus = async (id, isActive) => {
  const { data } = await api.patch(`/admin/students/${id}/status`, { isActive });
  return data.data;
};
