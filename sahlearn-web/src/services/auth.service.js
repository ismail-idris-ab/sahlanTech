import api from './api';

export const login = async (email, password) => {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data.data;
};

export const me = async () => {
  const { data } = await api.get('/api/auth/me');
  return data.data;
};

export const logout = () => {
  localStorage.removeItem('sahlearn_token');
};

export const createAdmin = async ({ name, email, password }) => {
  const { data } = await api.post('/api/auth/register', { name, email, password });
  return data.data;
};

export const listAdmins = async () => {
  const { data } = await api.get('/api/auth/users');
  return data.data;
};

export const deleteAdmin = async (id) => {
  const { data } = await api.delete(`/api/auth/users/${id}`);
  return data.data;
};
