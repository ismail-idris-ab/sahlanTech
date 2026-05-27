import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStudentById, triggerPasswordReset, toggleStudentStatus } from '../../services/adminStudents.service';
import { ArrowLeft, Mail, RefreshCw, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentDetail() {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    getStudentById(id).then(setStudent).catch(() => toast.error('Student not found')).finally(() => setLoading(false));
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
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/admin/students" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900 transition">
          <ArrowLeft size={14} /> Students
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <div className="flex items-start gap-4">
          {student.avatar?.url ? (
            <img src={student.avatar.url} alt={student.fullName} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-lg font-bold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-display text-ink-900">{student.fullName}</h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${student.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {student.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-ink-400 mt-0.5 font-mono">{student.studentId}</p>
            <p className="text-sm text-ink-500 mt-0.5 flex items-center gap-1"><Mail size={13} /> {student.email}</p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={handleResetPassword}
              disabled={resetting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-surface-300 rounded-xl hover:bg-surface-100 transition disabled:opacity-60"
            >
              <RefreshCw size={12} /> {resetting ? 'Sending...' : 'Reset Password'}
            </button>
            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition disabled:opacity-60 ${
                student.isActive ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {student.isActive ? <><UserX size={12} /> Deactivate</> : <><UserCheck size={12} /> Activate</>}
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {student.phone && <div><p className="text-xs text-ink-400">Phone</p><p className="text-ink-700">{student.phone}</p></div>}
          {student.dateOfBirth && <div><p className="text-xs text-ink-400">Date of Birth</p><p className="text-ink-700">{new Date(student.dateOfBirth).toLocaleDateString('en-NG')}</p></div>}
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
    </div>
  );
}
