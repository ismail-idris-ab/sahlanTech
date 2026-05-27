import api from './api';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

export const getMessages = async ({ page = 1, limit = 30 } = {}) => {
  const { data } = await api.get('/student/messages', {
    params: { page, limit },
    headers: authHeader(),
  });
  return data; // { status, data: messages[], meta }
};

export const sendMessage = async (content) => {
  const { data } = await api.post('/student/messages', { content }, { headers: authHeader() });
  return data.data;
};

export const getUnreadCount = async () => {
  const { data } = await api.get('/student/messages/unread-count', { headers: authHeader() });
  return data.data.count;
};
