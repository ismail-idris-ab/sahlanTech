import api from './api';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const getReceipt = (token) => api.get(`/api/receipts/${token}`).then((r) => r.data.data);

export const receiptPdfUrl = (token) => `${API_BASE}/api/receipts/${token}/pdf`;

// The page a customer opens. The site's own origin, not the API's.
export const receiptPageUrl = (token) =>
  `${import.meta.env.VITE_SITE_URL || window.location.origin}/receipt/${token}`;

export const formatNaira = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`;

// wa.me can only carry text, never a file — which is why the receipt has a page.
export const whatsappShareUrl = (phone, token, receiptNo) => {
  const digits = String(phone || '')
    .replace(/\D/g, '')
    .replace(/^0/, '234');
  const text = encodeURIComponent(
    `Receipt ${receiptNo} from Sahlearn.\nView or download it here: ${receiptPageUrl(token)}`
  );
  return `https://wa.me/${digits}?text=${text}`;
};

const studentHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

export const getMyReceipts = ({ page = 1, limit = 20 } = {}) =>
  api
    .get('/api/student/receipts', { params: { page, limit }, headers: studentHeader() })
    .then((r) => ({ data: r.data.data, meta: r.data.meta, summary: r.data.summary }));
