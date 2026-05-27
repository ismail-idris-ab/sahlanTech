import api from './api';

const TOKEN_KEY = 'sahlearn_student_token';

export const studentLogin = async ({ email, password }) => {
  const { data } = await api.post('/student/auth/login', { email, password });
  return data.data; // { token, student }
};

export const studentForgotPassword = async ({ email }) => {
  const { data } = await api.post('/student/auth/forgot-password', { email });
  return data.data;
};

export const studentResetPassword = async ({ token, password }) => {
  const { data } = await api.post('/student/auth/reset-password', { token, password });
  return data.data;
};

export const getStudentToken = () => localStorage.getItem(TOKEN_KEY);
