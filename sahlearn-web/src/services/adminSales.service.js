import api from './api';

const adminHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('sahlearn_token')}` });

export const listSales = ({ page = 1, limit = 20, status = '', q = '' } = {}) =>
  api
    .get('/api/admin/sales', {
      params: { page, limit, ...(status && { status }), ...(q && { q }) },
      headers: adminHeader(),
    })
    .then((r) => ({ data: r.data.data, meta: r.data.meta }));

export const createSale = (payload) =>
  api.post('/api/admin/sales', payload, { headers: adminHeader() }).then((r) => r.data.data);

export const getSale = (id) =>
  api.get(`/api/admin/sales/${id}`, { headers: adminHeader() }).then((r) => r.data.data);

export const updateSale = (id, payload) =>
  api.patch(`/api/admin/sales/${id}`, payload, { headers: adminHeader() }).then((r) => r.data.data);

export const voidSale = (id, reason) =>
  api.post(`/api/admin/sales/${id}/void`, { reason }, { headers: adminHeader() }).then((r) => r.data.data);

export const recordPayment = (saleId, payload) =>
  api
    .post(`/api/admin/sales/${saleId}/payments`, payload, { headers: adminHeader() })
    .then((r) => r.data.data);

export const voidPayment = (paymentId, reason) =>
  api
    .post(`/api/admin/payments/${paymentId}/void`, { reason }, { headers: adminHeader() })
    .then((r) => r.data.data);
