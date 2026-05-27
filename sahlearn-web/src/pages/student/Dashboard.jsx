import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { getMe } from '../../services/student.service';
import { BookOpen, User } from 'lucide-react';

export default function StudentDashboard() {
  const { student, setStudent } = useStudentAuth();
  const [loading, setLoading] = useState(!student?.enrolledCourses);

  useEffect(() => {
    if (!student?.enrolledCourses) {
      getMe().then((data) => { setStudent(data); setLoading(false); }).catch(() => setLoading(false));
    }
  }, []);

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const courseCount = student?.enrolledCourses?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Welcome back, {student?.fullName?.split(' ')[0]}</h1>
        <p className="text-sm text-ink-400 mt-0.5">Student ID: {student?.studentId}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-surface-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <BookOpen size={22} className="text-brand-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-ink-900">{courseCount}</p>
            <p className="text-sm text-ink-400">Enrolled Course{courseCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <Link to="/student/profile" className="bg-white rounded-2xl border border-surface-200 p-5 flex items-center gap-4 hover:border-brand-primary/30 transition">
          <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center">
            <User size={22} className="text-ink-500" />
          </div>
          <div>
            <p className="font-semibold text-ink-900">My Profile</p>
            <p className="text-sm text-ink-400">Update info & photo</p>
          </div>
        </Link>
      </div>

      {courseCount > 0 && (
        <div className="bg-white rounded-2xl border border-surface-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">My Courses</h2>
            <Link to="/student/courses" className="text-xs text-brand-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {student.enrolledCourses.slice(0, 3).map((ec) => (
              <div key={ec.enrollmentId || ec.course?._id} className="flex items-center gap-3">
                {ec.course?.coverImage?.url ? (
                  <img src={ec.course.coverImage.url} alt={ec.course.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-surface-200 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{ec.course?.title || 'Course'}</p>
                  <p className="text-xs text-ink-400">{ec.course?.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
