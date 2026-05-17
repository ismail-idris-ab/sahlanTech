import api from './api';

export const uploadImage = (file, folder = 'courses') => {
  const form = new FormData();
  form.append('image', file);
  return api.post(`/api/upload?folder=${folder}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data.data);
};
