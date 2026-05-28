import api from './api';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

export const getExams = async () => {
  const { data } = await api.get('/student/exams', { headers: authHeader() });
  return data; // full envelope: { status, data[], meta }
};

export const getExam = async (id) => {
  const { data } = await api.get(`/student/exams/${id}`, { headers: authHeader() });
  return data.data; // { exam, myAttempt }
};

export const submitExam = async (id, answers) => {
  const { data } = await api.post(
    `/student/exams/${id}/submit`,
    { answers },
    { headers: authHeader() }
  );
  return data.data; // ExamAttempt
};

export const getMyAttempts = async () => {
  const { data } = await api.get('/student/exams/my-attempts', { headers: authHeader() });
  return data.data;
};
