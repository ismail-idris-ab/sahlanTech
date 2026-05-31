import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getStudents } from '../../services/adminStudents.service';
import { Search, ChevronRight, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';

const GRAD = ['linear-gradient(135deg,#068562,#71B280)', 'linear-gradient(135deg,#C9962A,#E8B84B)', 'linear-gradient(135deg,#8b5cf6,#6366f1)', 'linear-gradient(135deg,#3b82f6,#60a5fa)', 'linear-gradient(135deg,#f97316,#fb923c)'];
const avatarGrad = (name) => GRAD[(name?.charCodeAt(0) ?? 0) % GRAD.length];

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudents({ page, search });
      setStudents(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Students</h1>
          <p className="text-xs text-ink-400 mt-0.5">{meta.total} total student{meta.total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search name, email, ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-ink-300/20 overflow-hidden shadow-card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-ink-400">No students found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-left">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Student</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden sm:table-cell">ID</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden md:table-cell">Temp Password</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden lg:table-cell">Courses</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden lg:table-cell">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {students.map((s) => {
                const initials = s.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                return (
                  <tr key={s.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                          style={{ background: avatarGrad(s.fullName) }}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-ink-900">{s.fullName}</p>
                          <p className="text-xs text-ink-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-500 hidden sm:table-cell font-mono text-xs">{s.studentId}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {s.tempPassword
                        ? <span className="font-mono text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">{s.tempPassword}</span>
                        : <span className="text-xs text-ink-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-ink-600 hidden lg:table-cell">{s.enrolledCourses?.length || 0}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <StatusBadge status={s.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/admin/students/${s.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: 'rgba(6,133,98,0.08)', color: '#068562', border: '1px solid rgba(6,133,98,0.15)' }}
                      >
                        View <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 bg-surface-50 border-t border-surface-200">
            <p className="text-xs text-ink-400">
              Showing {students.length} of {meta.total}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium border border-surface-300 rounded-lg disabled:opacity-40 hover:bg-surface-100 transition bg-white text-ink-600"
              >
                ← Prev
              </button>
              {(() => {
                const total = meta.totalPages;
                const start = Math.max(1, Math.min(page - 2, total - 4));
                const end = Math.min(total, start + 4);
                return Array.from({ length: end - start + 1 }, (_, i) => start + i);
              })().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition"
                  style={page === p
                    ? { background: '#068562', color: '#fff' }
                    : { background: '#fff', color: '#506860', border: '1px solid rgba(168,196,188,0.4)' }
                  }
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === meta.totalPages}
                className="px-3 py-1.5 text-xs font-medium border border-surface-300 rounded-lg disabled:opacity-40 hover:bg-surface-100 transition bg-white text-ink-600"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
