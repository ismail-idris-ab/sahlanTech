// sahlearn-web/src/pages/student/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { getMe, getStats } from '../../services/student.service';
import { getAssignments } from '../../services/studentAssignments.service';
import { getExams } from '../../services/studentExams.service';
import { BookOpen, ClipboardList, FileText, TrendingUp, ChevronRight } from 'lucide-react';

export default function StudentDashboard() {
  const { student, setStudent } = useStudentAuth();
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(!student?.enrolledCourses);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [me, s, assignRes, examRes] = await Promise.all([
          student?.enrolledCourses ? Promise.resolve(student) : getMe(),
          getStats(),
          getAssignments({ limit: 20 }).catch(() => ({ data: [] })),
          getExams().catch(() => ({ data: [] })),
        ]);
        setStudent(me);
        setStats(s);

        const now = new Date();
        const pendingAssignments = (assignRes.data || [])
          .filter((a) => !a.mySubmission && a.dueDate && new Date(a.dueDate) > now)
          .map((a) => ({
            id: a._id,
            title: a.title,
            course: a.course?.title || '',
            dueDate: new Date(a.dueDate),
            type: 'assignment',
            link: `/student/assignments/${a._id}`,
          }));

        const pendingExams = (examRes.data || [])
          .filter((e) => !e.myAttempt && e.dueDate && new Date(e.dueDate) > now)
          .map((e) => ({
            id: e._id || e.id,
            title: e.title,
            course: e.course?.title || '',
            dueDate: new Date(e.dueDate),
            type: 'exam',
            link: `/student/exams`,
          }));

        const all = [...pendingAssignments, ...pendingExams].sort((a, b) => a.dueDate - b.dueDate).slice(0, 5);
        setUpcoming(all);
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
  const pendingCount = stats?.assignments?.pending ?? 0;

  const daysUntil = (date) => {
    const diff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `In ${diff} days`;
  };

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Welcome banner */}
      <div
        className="relative rounded-2xl overflow-hidden p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, #068562 0%, #013F4A 100%)' }}
      >
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4), transparent)' }}
        />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#71B280' }}>
            {greeting}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl text-white leading-tight">
            Welcome back, {student?.fullName?.split(' ')?.[0] ?? 'there'}
          </h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Student ID: {student?.studentId}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(113,178,128,0.2)', color: '#71B280', border: '1px solid rgba(113,178,128,0.3)' }}
            >
              {courseCount} Course{courseCount !== 1 ? 's' : ''} enrolled
            </span>
            {pendingCount > 0 && (
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(201,150,42,0.2)', color: '#E8B84B', border: '1px solid rgba(201,150,42,0.3)' }}
              >
                {pendingCount} assignment{pendingCount !== 1 ? 's' : ''} pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Link to="/student/courses" className="bg-white rounded-2xl border border-surface-200 p-4 sm:p-5 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,133,98,0.1)' }}>
              <BookOpen size={18} className="text-brand-primary" />
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(6,133,98,0.08)', color: '#068562' }}>
              Active
            </span>
          </div>
          <p className="text-3xl font-display text-brand-primary leading-none mb-1">{courseCount}</p>
          <p className="text-xs font-medium text-ink-500">Enrolled Courses</p>
        </Link>

        <Link to="/student/assignments" className="bg-white rounded-2xl border border-surface-200 p-4 sm:p-5 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
              <ClipboardList size={18} className="text-blue-600" />
            </div>
            {pendingCount > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                {pendingCount} pending
              </span>
            )}
          </div>
          <p className="text-3xl font-display text-ink-900 leading-none mb-1">
            {stats ? `${stats.assignments.submitted} / ${stats.assignments.total}` : '—'}
          </p>
          <p className="text-xs font-medium text-ink-500">Assignments Submitted</p>
        </Link>

        <Link to="/student/exams" className="bg-white rounded-2xl border border-surface-200 p-4 sm:p-5 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50">
              <FileText size={18} className="text-purple-600" />
            </div>
            {stats?.exams?.avgScore != null && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 flex items-center gap-0.5">
                <TrendingUp size={9} /> Avg {stats.exams.avgScore}%
              </span>
            )}
          </div>
          <p className="text-3xl font-display text-ink-900 leading-none mb-1">
            {stats ? stats.exams.taken : '—'}
          </p>
          <p className="text-xs font-medium text-ink-500">Exams Taken</p>
        </Link>
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

        {/* Upcoming */}
        <div className="bg-white rounded-2xl border border-surface-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-ink-900">Upcoming</p>
            <Link to="/student/assignments" className="text-xs text-brand-primary hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={11} />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-xs text-ink-400 py-4 text-center">Nothing due soon.</p>
          ) : (
            <div className="space-y-0">
              {upcoming.map((item) => (
                <Link key={item.id} to={item.link} className="flex items-start gap-3 py-3 border-b border-surface-100 last:border-0 hover:bg-surface-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: item.type === 'exam' ? '#8b5cf6' : '#f97316' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-800 truncate">{item.title}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{item.course}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-orange-50 text-orange-600">
                    {daysUntil(item.dueDate)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Courses */}
        <div className="bg-white rounded-2xl border border-surface-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-ink-900">My Courses</p>
            <Link to="/student/courses" className="text-xs text-brand-primary hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={11} />
            </Link>
          </div>
          {courseCount === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-ink-400">No courses enrolled yet.</p>
              <Link to="/courses" className="text-xs text-brand-primary hover:underline mt-1 block">Browse courses →</Link>
            </div>
          ) : (
            <div className="space-y-0">
              {student.enrolledCourses.slice(0, 4).map((ec) => (
                <div key={ec.enrollmentId || ec.course?._id} className="flex items-center gap-3 py-3 border-b border-surface-100 last:border-0">
                  {ec.course?.coverImage?.url ? (
                    <img src={ec.course.coverImage.url} alt={ec.course.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #068562, #71B280)' }} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 truncate">{ec.course?.title || 'Course'}</p>
                    <p className="text-xs text-ink-400">{ec.course?.category}</p>
                    <div className="h-1 bg-surface-200 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-1 rounded-full" style={{ width: '0%', background: 'linear-gradient(90deg, #068562, #71B280)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
