// sahlearn-web/src/context/StudentAuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const StudentAuthContext = createContext(null);

const TOKEN_KEY = 'sahlearn_student_token';

export function StudentAuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }

    api.get('/api/student/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setStudent(data.data))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const loginStudent = (token, studentData) => {
    localStorage.setItem(TOKEN_KEY, token);
    setStudent(studentData);
  };

  const logoutStudent = () => {
    localStorage.removeItem(TOKEN_KEY);
    setStudent(null);
  };

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  return (
    <StudentAuthContext.Provider value={{ student, setStudent, loading, loginStudent, logoutStudent, getToken }}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export const useStudentAuth = () => useContext(StudentAuthContext);
