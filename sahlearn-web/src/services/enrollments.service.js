import api from './api';

export const submitEnrollment = (formData) =>
  api.post('/api/enrollments', formData).then((r) => r.data);

export const adminGetEnrollments = (params = {}) =>
  api.get('/api/enrollments', { params }).then((r) => r.data);

export const updateEnrollmentStatus = (id, updates) =>
  api.patch(`/api/enrollments/${id}`, updates).then((r) => r.data.data);

export const confirmEnrollmentPayment = (id, body = {}) =>
  api.patch(`/api/enrollments/${id}/confirm`, body).then((r) => r.data.data);

export const uploadPaymentProof = (id, file) => {
  const fd = new FormData();
  fd.append('paymentProof', file);
  return api.post(`/api/enrollments/${id}/payment-proof`, fd).then((r) => r.data.data);
};

export const deleteEnrollment = (id) =>
  api.delete(`/api/enrollments/${id}`).then((r) => r.data);
