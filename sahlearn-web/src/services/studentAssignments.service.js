import api from './api';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

export const getAssignments = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/api/student/assignments', {
    params: { page, limit },
    headers: authHeader(),
  });
  return data; // { status, data: assignments[], meta }
};

export const getAssignment = async (id) => {
  const { data } = await api.get(`/api/student/assignments/${id}`, { headers: authHeader() });
  return data.data; // { ...assignment, mySubmission }
};

export const submitAssignment = async (id, file, note) => {
  const form = new FormData();
  form.append('file', file);
  if (note) form.append('note', note);
  const { data } = await api.post(`/api/student/assignments/${id}/submit`, form, {
    headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const getMySubmissions = async () => {
  const { data } = await api.get('/api/student/assignments/my-submissions', { headers: authHeader() });
  return data.data;
};
