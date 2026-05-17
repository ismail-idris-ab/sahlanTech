import api from './api';

export const getCourses = (params) => api.get('/api/courses', { params }).then((r) => r.data);
export const getCourseBySlug = (slug) => api.get(`/api/courses/${slug}`).then((r) => r.data.data);

export const adminGetCourses = (params) => api.get('/api/admin/courses', { params }).then((r) => r.data);
export const adminGetCourse = (id) => api.get(`/api/admin/courses/${id}`).then((r) => r.data.data);
export const createCourse = (body) => api.post('/api/courses', body).then((r) => r.data.data);
export const updateCourse = (id, body) => api.patch(`/api/courses/${id}`, body).then((r) => r.data.data);
export const deleteCourse = (id) => api.delete(`/api/courses/${id}`).then((r) => r.data);
