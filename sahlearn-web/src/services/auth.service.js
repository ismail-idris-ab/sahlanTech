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
