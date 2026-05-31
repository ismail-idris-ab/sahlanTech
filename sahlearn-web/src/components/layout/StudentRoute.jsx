import { Navigate } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';

export default function StudentRoute({ children }) {
  const { student, loading } = useStudentAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-100">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) return <Navigate to="/student/login" replace />;

  if (student.mustChangePassword) return <Navigate to="/student/change-password" replace />;

  return children;
}
