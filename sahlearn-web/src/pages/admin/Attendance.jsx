// sahlearn-web/src/pages/admin/Attendance.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSessions, deleteSession } from '../../services/adminAttendance.service';
import api from '../../services/api';
import { Plus, Trash2, ChevronRight, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  high: 'text-green-700 bg-green-50',
  mid: 'text-amber-700 bg-amber-50',
  low: 'text-red-700 bg-red-50',
};

export default function AdminAttendance() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [filterCourse, setFilterCourse] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ course: '', label: '', date: '', note: '' });
  const [saving, setSaving] = useState(false);

  const load = (course = filterCourse) => {
    setLoading(true);
    getSessions({ limit: 50, course: course || undefined })
      .then(setData)
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/api/admin/courses?limit=100').then(({ data: d }) => setCourses(d.data || [])).catch(() => {});
    load();
  }, []);

  const handleFilter = (e) => {
    setFilterCourse(e.target.value);
    load(e.target.value);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.course || !form.label || !form.date) { toast.error('Course, label and date required'); return; }
    setSaving(true);
    try {
      const { data: d } = await api.post('/api/admin/attendance/sessions', form);
      toast.success('Session created');
      setShowForm(false);
      setForm({ course: '', label: '', date: '', note: '' });
      navigate(`/admin/attendance/${d.data.id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create session');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Delete "${label}"? All attendance records will be lost.`)) return;
    try {
      await deleteSession(id);
      setData((prev) => ({ ...prev, data: prev.data.filter((s) => s.id !== id) }));
      toast.success('Session deleted');
    } catch {
      toast.error('Failed to delete session');
    }
  };

  const sessions = data?.data || [];

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Attendance</h1>
          <p className="text-xs text-ink-400 mt-0.5">{data?.meta?.total ?? 0} session{data?.meta?.total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition"
        >
          <Plus size={15} /> New Session
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card p-5">
          <h2 className="font-semibold text-ink-900 mb-4">New Attendance Session</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Course *</label>
                <select
                  value={form.course}
                  onChange={(e) => setForm({ ...form, course: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
                >
                  <option value="">Select course...</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Date *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Label *</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                required
                maxLength={200}
                placeholder="e.g. Week 3 — Thursday"
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Note (optional)</label>
              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                maxLength={200}
                placeholder="e.g. Topic covered, venue..."
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60">
                {saving ? 'Creating...' : 'Create & Mark Attendance'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-surface-300 text-ink-600 text-sm rounded-xl hover:bg-surface-100 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterCourse}
          onChange={handleFilter}
          className="px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
        >
          <option value="">All courses</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <span className="text-sm text-ink-400">{data?.meta?.total ?? 0} session{data?.meta?.total !== 1 ? 's' : ''}</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card p-12 text-center text-ink-400 text-sm">
          No sessions yet. Create one to start marking attendance.
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const pct = s.recordCount > 0 ? Math.round((s.presentCount / s.recordCount) * 100) : null;
            const colorKey = pct === null ? null : pct >= 70 ? 'high' : pct >= 50 ? 'mid' : 'low';
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-ink-300/20 shadow-card flex items-center gap-4 px-5 py-4 hover:border-brand-primary/30 transition group">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                  <CalendarDays size={18} className="text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink-900 truncate">{s.label}</p>
                  <div className="flex items-center gap-2 text-xs text-ink-400 mt-0.5">
                    <span>{s.course?.title}</span>
                    <span>·</span>
                    <span>{new Date(s.date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {pct !== null && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[colorKey]}`}>
                      {s.presentCount}/{s.recordCount} present
                    </span>
                  )}
                  {pct === null && s.recordCount === 0 && (
                    <span className="text-xs text-ink-300 italic">Not marked</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(s.id, s.label); }}
                    className="p-1.5 text-ink-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                  <Link to={`/admin/attendance/${s.id}`} className="p-1.5 text-ink-400 hover:text-brand-primary transition">
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
