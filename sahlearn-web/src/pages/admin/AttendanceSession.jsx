// sahlearn-web/src/pages/admin/AttendanceSession.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSession, saveRecords } from '../../services/adminAttendance.service';
import { CalendarCheck, CheckCircle2, XCircle, Clock, ShieldCheck, Save, Download } from 'lucide-react';
import { downloadFile } from '../../utils/download';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', icon: CheckCircle2, color: 'bg-green-50 border-green-300 text-green-700' },
  { value: 'late', label: 'Late', icon: Clock, color: 'bg-amber-50 border-amber-300 text-amber-700' },
  { value: 'excused', label: 'Excused', icon: ShieldCheck, color: 'bg-blue-50 border-blue-300 text-blue-700' },
  { value: 'absent', label: 'Absent', icon: XCircle, color: 'bg-red-50 border-red-200 text-red-600' },
];

const statusColor = (status) => STATUS_OPTIONS.find((o) => o.value === status)?.color || '';

export default function AdminAttendanceSession() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSession(id)
      .then((res) => {
        setData(res);
        const init = {};
        for (const s of res.roster) init[s.studentId] = s.status;
        setAttendance(init);
      })
      .catch(() => toast.error('Failed to load session'))
      .finally(() => setLoading(false));
  }, [id]);

  const setAll = (status) => {
    setAttendance((prev) => Object.fromEntries(Object.keys(prev).map((k) => [k, status])));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({ studentId, status }));
      await saveRecords(id, records);
      toast.success('Attendance saved');
    } catch {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!data) return (
    <div className="text-center py-12 text-ink-500">
      Session not found. <Link to="/admin/attendance" className="text-brand-primary hover:underline">Back</Link>
    </div>
  );

  const { session, roster } = data;
  const counts = STATUS_OPTIONS.map((o) => ({
    ...o,
    count: Object.values(attendance).filter((s) => s === o.value).length,
  }));
  const total = roster.length;

  return (
    <div className="max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-ink-400">
        <Link to="/admin/attendance" className="hover:text-ink-900 transition">Attendance</Link>
        <span>›</span>
        <span className="font-semibold" style={{ color: '#068562' }}>{session.label}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(6,133,98,0.1)' }}
        >
          <CalendarCheck size={24} className="text-brand-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display text-ink-900">{session.label}</h1>
          <p className="text-xs text-ink-400 mt-0.5">{session.course?.title}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-100 text-ink-500 border border-surface-300">
              {new Date(session.date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {total} student{total !== 1 ? 's' : ''}
            </span>
            {counts.filter((c) => c.count > 0).map((c) => (
              <span key={c.value} className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${c.color}`}>
                {c.count} {c.label}
              </span>
            ))}
          </div>
          {session.note && <p className="text-xs text-ink-400 mt-1 italic">{session.note}</p>}
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <button
            onClick={async () => {
              try {
                const dateStr = new Date(session.date).toISOString().slice(0, 10);
                await downloadFile(`/api/admin/exports/attendance/${id}/register.pdf`, `attendance-${dateStr}.pdf`);
              } catch {
                toast.error('Failed to generate register');
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-surface-100 text-ink-700 border border-surface-300 hover:bg-surface-200 transition"
          >
            <Download size={13} /> Register PDF
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {total > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-ink-400 mr-1">Mark all:</span>
          {STATUS_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setAll(o.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition hover:opacity-80 ${o.color}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* Roster */}
      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-10 text-center text-ink-400 text-sm">
          No enrolled students found for this course.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-surface-100 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-700">{total} student{total !== 1 ? 's' : ''}</span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
            >
              <Save size={13} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="divide-y divide-surface-100">
            {roster.map((student) => {
              const current = attendance[student.studentId] || 'absent';
              const initials = student.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

              return (
                <div key={student.studentId} className="flex items-center gap-4 px-5 py-3">
                  {student.avatar?.url ? (
                    <img src={student.avatar.url} alt={student.fullName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 truncate">{student.fullName}</p>
                    <p className="text-xs text-ink-400 font-mono">{student.studentCode}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {STATUS_OPTIONS.map((o) => {
                      const active = current === o.value;
                      return (
                        <button
                          key={o.value}
                          onClick={() => setAttendance((prev) => ({ ...prev, [student.studentId]: o.value }))}
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg border transition ${
                            active ? o.color : 'border-surface-200 text-ink-400 hover:border-surface-400'
                          }`}
                          title={o.label}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-3 border-t border-surface-100 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
            >
              <Save size={13} /> {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
