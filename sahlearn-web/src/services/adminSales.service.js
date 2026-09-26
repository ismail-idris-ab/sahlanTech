import api from './api';

const adminHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('sahlearn_token')}` });

export const listSales = ({ page = 1, limit = 20, status = '', q = '' } = {}) =>
  api
    .get('/api/admin/sales', {
      params: { page, limit, ...(status && { status }), ...(q && { q }) },
      headers: adminHeader(),
    })
    .then((r) => ({ data: r.data.data, meta: r.data.meta }));

// The CSV endpoints are behind the admin token, so a plain <a href> download
// will not do: the file is fetched as a blob and handed to the browser from
// memory, with the server's own filename where it sent one.
const downloadCsv = async (path, { params, fallbackName }) => {
  const res = await api.get(path, { params, headers: adminHeader(), responseType: 'blob' });

  const match = /filename="([^"]+)"/.exec(res.headers['content-disposition'] || '');
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = match ? match[1] : fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const exportSalesCsv = ({ status = '', q = '' } = {}) =>
  downloadCsv('/api/admin/sales/export', {
    params: { ...(status && { status }), ...(q && { q }) },
    fallbackName: 'sahlearn-sales.csv',
  });

export const exportSaleCsv = (id) =>
  downloadCsv(`/api/admin/sales/${id}/export`, { fallbackName: 'sahlearn-sale.csv' });

export const deleteSale = (id) =>
  api.delete(`/api/admin/sales/${id}`, { headers: adminHeader() }).then((r) => r.data.data);

export const bulkDeleteSales = (ids) =>
  api
    .post('/api/admin/sales/bulk-delete', { ids }, { headers: adminHeader() })
    .then((r) => r.data.data);

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
