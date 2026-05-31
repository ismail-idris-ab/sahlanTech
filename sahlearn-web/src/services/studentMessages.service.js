import api from './api';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

export const getMessages = async ({ page = 1, limit = 30 } = {}) => {
  const { data } = await api.get('/api/student/messages', {
    params: { page, limit },
    headers: authHeader(),
  });
  return data; // { status, data: messages[], meta }
};

export const sendMessage = async (content, file = null) => {
  const fd = new FormData();
  if (content) fd.append('content', content);
  if (file) fd.append('file', file);
  const { data } = await api.post('/api/student/messages', fd, { headers: authHeader() });
  return data.data;
};

export const getUnreadCount = async () => {
  const { data } = await api.get('/api/student/messages/unread-count', { headers: authHeader() });
  return data.data.count;
};
