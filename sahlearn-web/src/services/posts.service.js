import api from './api';

export const getPosts = (params = {}) =>
  api.get('/api/posts', { params }).then((r) => r.data);

export const getPostBySlug = (slug) =>
  api.get(`/api/posts/${slug}`).then((r) => r.data.data);

export const adminGetPosts = (params = {}) =>
  api.get('/api/admin/posts', { params }).then((r) => r.data);

export const adminGetPost = (id) =>
  api.get(`/api/admin/posts/${id}`).then((r) => r.data.data);

export const createPost = (data) =>
  api.post('/api/posts', data).then((r) => r.data.data);

export const updatePost = (id, data) =>
  api.patch(`/api/posts/${id}`, data).then((r) => r.data.data);

export const deletePost = (id) =>
  api.delete(`/api/posts/${id}`).then((r) => r.data);
