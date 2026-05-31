import api from './api';

export const getContent = (key) =>
  api.get(`/api/content/${key}`).then((r) => r.data.data);

export const updateContent = (key, data) =>
  api.put(`/api/content/${key}`, data).then((r) => r.data.data);
