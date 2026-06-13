import api from './api';

const studentHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

const adminHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_token')}`,
});

export const checkIn = () =>
  api.post('/api/student/checkin', {}, { headers: studentHeader() }).then((r) => r.data.data);

export const getMyCheckIns = () =>
  api.get('/api/student/checkin/me', { headers: studentHeader() }).then((r) => r.data.data);

export const getAdminCheckIns = ({ page = 1, limit = 20, search = '' } = {}) =>
  api
    .get('/api/admin/checkins', { params: { page, limit, search }, headers: adminHeader() })
    .then((r) => ({ data: r.data.data, meta: r.data.meta }));

export const deleteCheckIn = (id) =>
  api.delete(`/api/admin/checkins/${id}`, { headers: adminHeader() });

export const deleteCheckIns = (ids) =>
  api.delete('/api/admin/checkins', { data: { ids }, headers: adminHeader() });

export const deleteAllCheckIns = () =>
  api.delete('/api/admin/checkins', { data: {}, headers: adminHeader() });

export const exportCheckIns = async () => {
  const res = await api.get('/api/admin/checkins/export', {
    headers: adminHeader(),
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'attendance.csv';
  a.click();
  URL.revokeObjectURL(url);
};
