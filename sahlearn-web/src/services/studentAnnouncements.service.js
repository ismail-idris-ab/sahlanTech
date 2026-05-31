import api from './api';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

export const getMyAnnouncements = async () => {
  const { data } = await api.get('/api/student/announcements', { headers: authHeader() });
  return data.data;
};
