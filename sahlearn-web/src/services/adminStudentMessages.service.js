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

export const sendReply = async (studentId, content, file = null) => {
  const fd = new FormData();
  if (content) fd.append('content', content);
  if (file) fd.append('file', file);
  const { data } = await api.post(`/api/admin/student-messages/${studentId}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const getTotalUnread = async () => {
  const { data } = await api.get('/api/admin/student-messages/unread-count');
  return data.data.count;
};
