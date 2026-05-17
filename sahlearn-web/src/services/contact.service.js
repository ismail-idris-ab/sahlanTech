import api from './api';

export const submitContact = (data) =>
  api.post('/api/contact', data).then((r) => r.data);

export const adminGetMessages = (params = {}) =>
  api.get('/api/contact', { params }).then((r) => r.data);

export const updateMessageStatus = (id, status) =>
  api.patch(`/api/contact/${id}`, { status }).then((r) => r.data.data);

export const deleteMessage = (id) =>
  api.delete(`/api/contact/${id}`).then((r) => r.data);
