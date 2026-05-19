import api from './api';

export const submitEnrollment = (data) =>
  api.post('/api/enrollments', data).then((r) => r.data);

export const adminGetEnrollments = (params = {}) =>
  api.get('/api/enrollments', { params }).then((r) => r.data);

export const updateEnrollmentStatus = (id, updates) =>
  api.patch(`/api/enrollments/${id}`, updates).then((r) => r.data.data);

export const deleteEnrollment = (id) =>
  api.delete(`/api/enrollments/${id}`).then((r) => r.data);
