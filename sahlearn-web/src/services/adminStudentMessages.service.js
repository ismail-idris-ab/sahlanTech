import api from './api';

export const listConversations = async () => {
  const { data } = await api.get('/api/admin/student-messages');
  return data.data;
};

export const getConversation = async (studentId, { page = 1, limit = 50 } = {}) => {
  const { data } = await api.get(`/api/admin/student-messages/${studentId}`, {
    params: { page, limit },
  });
  return data.data; // { student, messages[], meta }
};

export const sendReply = async (studentId, content) => {
  const { data } = await api.post(`/api/admin/student-messages/${studentId}`, { content });
  return data.data;
};

export const getTotalUnread = async () => {
  const { data } = await api.get('/api/admin/student-messages/unread-count');
  return data.data.count;
};
