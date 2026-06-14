import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { getStudentById, triggerPasswordReset, toggleStudentStatus, getStudentProgress, impersonateStudent } from '../../services/adminStudents.service';
import { getStudentAttendance } from '../../services/adminAttendance.service';
import { RefreshCw, UserCheck, UserX, MessageCircle, ClipboardCheck, ClipboardList, Clock, CalendarCheck, CheckCircle2, XCircle, ShieldCheck, Download, ExternalLink } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import { downloadFile } from '../../utils/download';
import toast from 'react-hot-toast';

const pct = (score, max) => (max > 0 ? Math.round((score / max) * 100) : 0);

const ScoreBar = ({ score, max }) => {
  const percent = pct(score, max);
  const color = percent >= 70 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[11px] font-mono text-ink-400 w-9 text-right">{percent}%</span>
    </div>
  );
};

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loginStudent } = useStudentAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [progress, setProgress] = useState([]);
  const [progressLoading, setProgressLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

  useEffect(() => {
    getStudentById(id).then(setStudent).catch(() => toast.error('Student not found')).finally(() => setLoading(false));
    getStudentProgress(id).then(setProgress).catch(() => {}).finally(() => setProgressLoading(false));
    getStudentAttendance(id).then(setAttendance).catch(() => {}).finally(() => setAttendanceLoading(false));
  }, [id]);

  const handleResetPassword = async () => {
    if (!window.confirm(`Send a password reset link to ${student.email}?`)) return;
    setResetting(true);
    try {
      await triggerPasswordReset(id);
      toast.success('Reset link sent to student email');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reset link');
    } finally {
      setResetting(false);
    }
  };

  const handleImpersonate = async () => {
    setImpersonating(true);
    try {
      const { token, student: s } = await impersonateStudent(id);
      loginStudent(token, s);
      navigate('/student/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to access student dashboard');
    } finally {
      setImpersonating(false);
    }
  };

  const handleToggleStatus = async () => {
    const action = student.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this student account?`)) return;
    setToggling(true);
    try {
      const updated = await toggleStudentStatus(id, !student.isActive);
      setStudent((prev) => ({ ...prev, isActive: updated.isActive }));
      toast.success(`Account ${updated.isActive ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!student) return <div className="text-center py-12 text-ink-500">Student not found. <Link to="/admin/students" className="text-brand-primary hover:underline">Back to list</Link></div>;

  const initials = student.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

  return (
    <div className="max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-ink-400">
        <Link to="/admin/students" className="hover:text-ink-900 transition">Students</Link>
        <span>›</span>
        <span className="font-semibold" style={{ color: '#068562' }}>{student.fullName}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #068562, #71B280)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display text-ink-900">{student.fullName}</h1>
          <p className="text-xs text-ink-400 mt-0.5">{student.studentId} · {student.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge status={student.isActive ? 'active' : 'inactive'} />
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {student.enrolledCourses?.length || 0} Course{(student.enrolledCourses?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <button
            onClick={handleImpersonate}
            disabled={impersonating || !student.isActive}
            title={!student.isActive ? 'Student account is inactive' : 'Open student dashboard'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition disabled:opacity-40"
          >
            <ExternalLink size={13} className={impersonating ? 'animate-pulse' : ''} />
            {impersonating ? 'Opening…' : 'View Dashboard'}
          </button>
          <button
            onClick={async () => {
              try {
                await downloadFile(`/api/admin/exports/students/${id}/report.pdf`, `report-${student.studentId}.pdf`);
              } catch {
                toast.error('Failed to generate report');
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-surface-100 text-ink-700 border border-surface-300 hover:bg-surface-200 transition"
          >
            <Download size={13} /> Report PDF
          </button>
          <Link
            to={`/admin/student-messages/${student.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/20 transition"
          >
            <MessageCircle size={13} /> Message
          </Link>
          <button
            onClick={handleResetPassword}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-surface-100 text-ink-700 border border-surface-300 hover:bg-surface-200 transition disabled:opacity-40"
          >
            <RefreshCw size={13} className={resetting ? 'animate-spin' : ''} />
            {resetting ? 'Sending…' : 'Reset PW'}
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={toggling}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition disabled:opacity-40 ${
              student.isActive
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            }`}
          >
            {student.isActive ? <><UserX size={13} /> Deactivate</> : <><UserCheck size={13} /> Activate</>}
          </button>
        </div>
      </div>

      {/* Student details */}
      <div className="bg-white rounded-2xl border border-surface-200 p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {student.phone && <div><p className="text-xs text-ink-400">Phone</p><p className="text-ink-700">{student.phone}</p></div>}
          {student.dateOfBirth && <div><p className="text-xs text-ink-400">Date of Birth</p><p className="text-ink-700">{new Date(student.dateOfBirth).toLocaleDateString('en-NG')}</p></div>}
          {student.academicLevel && <div><p className="text-xs text-ink-400">Academic Level</p><p className="text-ink-700">{student.academicLevel}</p></div>}
          {student.address && <div><p className="text-xs text-ink-400">Address</p><p className="text-ink-700">{student.address}</p></div>}
          <div><p className="text-xs text-ink-400">Joined</p><p className="text-ink-700">{new Date(student.createdAt).toLocaleDateString('en-NG')}</p></div>
        </div>
        {student.bio && <p className="mt-4 text-sm text-ink-600 italic">{student.bio}</p>}
      </div>

      {/* Enrolled courses */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <h2 className="font-semibold text-ink-900 mb-4">Enrolled Courses ({student.enrolledCourses?.length || 0})</h2>
        {!student.enrolledCourses?.length ? (
          <p className="text-sm text-ink-400">No courses enrolled.</p>
        ) : (
          <div className="divide-y divide-surface-100">
            {student.enrolledCourses.map((ec) => (
              <div key={ec.enrollmentId || ec.course?._id} className="py-3 flex items-center gap-3">
                {ec.course?.coverImage?.url ? (
                  <img src={ec.course.coverImage.url} alt={ec.course.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-surface-200 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{ec.course?.title || 'Course'}</p>
                  <p className="text-xs text-ink-400">Enrolled {new Date(ec.enrolledAt).toLocaleDateString('en-NG')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Academic performance */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <h2 className="font-semibold text-ink-900 mb-4">Academic Performance</h2>

        {progressLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : progress.length === 0 ? (
          <p className="text-sm text-ink-400">No exam or assignment activity yet.</p>
        ) : (
          <div className="space-y-6">
            {progress.map((group) => {
              const gradedExams = group.exams.filter((e) => e.maxScore > 0);
              const examAvg = gradedExams.length
                ? Math.round(gradedExams.reduce((s, e) => s + pct(e.score, e.maxScore), 0) / gradedExams.length)
                : null;
              const gradedAssignments = group.assignments.filter((a) => a.score != null);
              const assignAvg = gradedAssignments.length
                ? Math.round(gradedAssignments.reduce((s, a) => s + pct(a.score, a.maxScore), 0) / gradedAssignments.length)
                : null;

              return (
                <div key={group.courseId}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-ink-800">{group.courseTitle}</h3>
                    <div className="flex gap-3 text-xs text-ink-400">
                      {examAvg != null && <span>Exam avg: <span className="font-semibold text-ink-700">{examAvg}%</span></span>}
                      {assignAvg != null && <span>Assignment avg: <span className="font-semibold text-ink-700">{assignAvg}%</span></span>}
                    </div>
                  </div>

                  {group.exams.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <ClipboardCheck size={12} className="text-ink-400" />
                        <span className="text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Exams</span>
                      </div>
                      <div className="space-y-3">
                        {group.exams.map((e) => (
                          <div key={e.examId}>
                            <div className="flex items-center justify-between gap-2">
                              <Link to={`/admin/exams/${e.examId}`} className="text-sm text-ink-700 hover:text-brand-primary transition truncate">
                                {e.title}
                              </Link>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {e.status === 'submitted' && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
                                    <Clock size={9} /> Pending
                                  </span>
                                )}
                                <span className="text-sm font-bold font-mono text-ink-900">
                                  {e.score}<span className="text-ink-400 font-normal text-xs">/{e.maxScore}</span>
                                </span>
                              </div>
                            </div>
                            <ScoreBar score={e.score} max={e.maxScore} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {group.assignments.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <ClipboardList size={12} className="text-ink-400" />
                        <span className="text-[10px] font-semibold text-ink-400 uppercase tracking-wide">Assignments</span>
                      </div>
                      <div className="space-y-3">
                        {group.assignments.map((a) => (
                          <div key={a.assignmentId}>
                            <div className="flex items-center justify-between gap-2">
                              <Link to={`/admin/assignments/${a.assignmentId}`} className="text-sm text-ink-700 hover:text-brand-primary transition truncate">
                                {a.title}
                              </Link>
                              {a.score != null ? (
                                <span className="text-sm font-bold font-mono text-ink-900 flex-shrink-0">
                                  {a.score}<span className="text-ink-400 font-normal text-xs">/{a.maxScore}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-ink-400 flex-shrink-0 italic">Not graded</span>
                              )}
                            </div>
                            {a.score != null && <ScoreBar score={a.score} max={a.maxScore} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {group.exams.length === 0 && group.assignments.length === 0 && (
                    <p className="text-xs text-ink-400 italic">No activity for this course.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attendance */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <h2 className="font-semibold text-ink-900 mb-4">Attendance</h2>

        {attendanceLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : attendance.length === 0 ? (
          <p className="text-sm text-ink-400">No attendance records yet.</p>
        ) : (
          <div className="space-y-5">
            {attendance.map((group) => {
              const pct = group.percentage;
              const color = pct === null ? 'text-ink-400' : pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500';
              return (
                <div key={group.courseId}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-ink-800">{group.courseTitle}</h3>
                    <span className={`text-sm font-bold ${color}`}>
                      {group.attended}/{group.total} {pct !== null ? `(${pct}%)` : ''}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {group.sessions.map((s) => {
                      const STATUS_ICON = { present: CheckCircle2, late: Clock, excused: ShieldCheck, absent: XCircle };
                      const STATUS_CLS = { present: 'text-green-600', late: 'text-amber-500', excused: 'text-blue-500', absent: 'text-red-400' };
                      const Icon = STATUS_ICON[s.status] || XCircle;
                      return (
                        <div key={s.sessionId} className="flex items-center gap-3 py-1.5 border-b border-surface-50 last:border-0">
                          <Icon size={14} className={`flex-shrink-0 ${STATUS_CLS[s.status]}`} />
                          <span className="text-sm text-ink-700 flex-1 truncate">{s.label}</span>
                          <span className="text-xs text-ink-400 flex-shrink-0">{new Date(s.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
