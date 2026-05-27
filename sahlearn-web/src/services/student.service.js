import api from './api';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

export const getMe = async () => {
  const { data } = await api.get('/student/me', { headers: authHeader() });
  return data.data;
};

export const updateProfile = async (updates) => {
  const { data } = await api.patch('/student/me', updates, { headers: authHeader() });
  return data.data;
};

export const uploadAvatar = async (file) => {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post('/student/me/avatar', form, {
    headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const deleteAvatar = async () => {
  const { data } = await api.delete('/student/me/avatar', { headers: authHeader() });
  return data.data;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const { data } = await api.patch('/student/me/password', { currentPassword, newPassword }, { headers: authHeader() });
  return data.data;
};
