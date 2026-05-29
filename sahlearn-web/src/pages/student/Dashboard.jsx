import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { getMe, getStats } from '../../services/student.service';
import { BookOpen, User, ClipboardList, FileText, TrendingUp } from 'lucide-react';

export default function StudentDashboard() {
  const { student, setStudent } = useStudentAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(!student?.enrolledCourses);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [me, s] = await Promise.all([
          student?.enrolledCourses ? Promise.resolve(student) : getMe(),
          getStats(),
        ]);
        setStudent(me);
        setStats(s);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const courseCount = student?.enrolledCourses?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Welcome back, {student?.fullName?.split(' ')?.[0] ?? 'there'}</h1>
        <p className="text-sm text-ink-400 mt-0.5">Student ID: {student?.studentId}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Enrolled courses */}
        <div className="bg-white rounded-2xl border border-surface-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen size={22} className="text-brand-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-ink-900">{courseCount}</p>
            <p className="text-sm text-ink-400">Enrolled Course{courseCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-2xl border border-surface-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <ClipboardList size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-ink-900">
              {stats ? `${stats.assignments.submitted} / ${stats.assignments.total}` : '—'}
            </p>
            <p className="text-sm text-ink-400">Assignments Submitted</p>
            {stats && stats.assignments.pending > 0 && (
              <p className="text-xs text-amber-600 font-medium mt-0.5">{stats.assignments.pending} pending</p>
            )}
          </div>
        </div>

        {/* Exams */}
        <div className="bg-white rounded-2xl border border-surface-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <FileText size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-ink-900">
              {stats ? stats.exams.taken : '—'}
            </p>
            <p className="text-sm text-ink-400">Exams Taken</p>
            {stats?.exams.avgScore !== null && stats?.exams.avgScore !== undefined && (
              <p className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1">
                <TrendingUp size={11} /> Avg {stats.exams.avgScore}%
              </p>
            )}
          </div>
        </div>

        {/* Profile link */}
        <Link to="/student/profile" className="bg-white rounded-2xl border border-surface-200 p-5 flex items-center gap-4 hover:border-brand-primary/30 transition">
          <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center flex-shrink-0">
            <User size={22} className="text-ink-500" />
          </div>
          <div>
            <p className="font-semibold text-ink-900">My Profile</p>
            <p className="text-sm text-ink-400">Update info & photo</p>
          </div>
        </Link>
      </div>

      {/* Recent courses */}
      {courseCount > 0 && (
        <div className="bg-white rounded-2xl border border-surface-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">My Courses</h2>
            <Link to="/student/courses" className="text-xs text-brand-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {student.enrolledCourses.slice(0, 3).map((ec) => (
              <div key={String(ec.enrollmentId || ec.course?._id || ec.course)} className="flex items-center gap-3">
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
