import api from './api';

export const getAnnouncements = async () => {
  const { data } = await api.get('/api/admin/announcements');
  return data; // { status, data[], meta }
};

export const createAnnouncement = async (formData) => {
  const { data } = await api.post('/api/admin/announcements', formData);
  return data.data;
};

export const updateAnnouncement = async (id, formData) => {
  const { data } = await api.patch(`/api/admin/announcements/${id}`, formData);
  return data.data;
};

export const deleteAnnouncement = async (id) => {
  const { data } = await api.delete(`/api/admin/announcements/${id}`);
  return data.data;
};
