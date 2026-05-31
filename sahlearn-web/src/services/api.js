import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sahlearn_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // For FormData, remove Content-Type so the browser sets it with the correct boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      if (url.includes('/student/')) {
        localStorage.removeItem('sahlearn_student_token');
        if (!url.includes('/auth/login')) {
          window.location.href = '/student/login';
        }
      } else {
        localStorage.removeItem('sahlearn_token');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
