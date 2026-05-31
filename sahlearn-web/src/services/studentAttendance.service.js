import api from './api';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

export const getMyAttendance = async () => {
  const { data } = await api.get('/api/student/attendance', { headers: authHeader() });
  return data.data; // CourseAttendanceGroup[]
};
