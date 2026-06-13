import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getStudents, deleteStudent, deleteStudents } from '../../services/adminStudents.service';
import { Search, ChevronRight, Trash2, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';

const PAGE_SIZE = 20;

const GRAD = ['linear-gradient(135deg,#068562,#71B280)', 'linear-gradient(135deg,#C9962A,#E8B84B)', 'linear-gradient(135deg,#8b5cf6,#6366f1)', 'linear-gradient(135deg,#3b82f6,#60a5fa)', 'linear-gradient(135deg,#f97316,#fb923c)'];
const avatarGrad = (name) => GRAD[(name?.charCodeAt(0) ?? 0) % GRAD.length];

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <p className="font-semibold text-ink-900">Confirm Delete</p>
        </div>
        <p className="text-sm text-ink-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-ink-700 border border-ink-200 rounded-lg hover:bg-surface-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async (p = page, q = search) => {
    setLoading(true);
    try {
      const res = await getStudents({ page: p, search: q });
      setStudents(res.data);
      setMeta(res.meta);
      setSelected(new Set());
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === students.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map((s) => s.id)));
    }
  };

  const handleDeleteOne = (id, name) => {
    setConfirm({
      message: `Delete "${name}"? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteStudent(id);
          toast.success('Student deleted');
          load(page, search);
        } catch {
          toast.error('Failed to delete student');
        }
      },
    });
  };

  const handleDeleteSelected = () => {
    const ids = [...selected];
    setConfirm({
      message: `Delete ${ids.length} selected student${ids.length !== 1 ? 's' : ''}? This cannot be undone.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await deleteStudents(ids);
          toast.success('Students deleted');
          load(page, search);
        } catch {
          toast.error('Failed to delete students');
        }
      },
    });
  };

  const allSelected = students.length > 0 && selected.size === students.length;

  return (
    <div className="space-y-5">
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Students</h1>
          <p className="text-xs text-ink-400 mt-0.5">{meta.total} total student{meta.total !== 1 ? 's' : ''}</p>
        </div>
        {selected.size > 0 && (
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} /> Delete Selected ({selected.size})
          </button>
        )}
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
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-ink-400 hover:text-ink-700">
                    {allSelected ? <CheckSquare size={16} className="text-brand-primary" /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 w-10">#</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Student</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden sm:table-cell">ID</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden md:table-cell">Temp Password</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden lg:table-cell">Courses</th>
                <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden lg:table-cell">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {students.map((s, i) => {
                const initials = s.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                return (
                  <tr key={s.id} className={`hover:bg-surface-50 transition-colors ${selected.has(s.id) ? 'bg-brand-primary/5' : ''}`}>
                    <td className="px-4 py-3.5">
                      <button onClick={() => toggleSelect(s.id)} className="text-ink-400 hover:text-ink-700">
                        {selected.has(s.id) ? <CheckSquare size={16} className="text-brand-primary" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-ink-400 text-xs">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-3.5">
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
                    <td className="px-4 py-3.5 text-ink-500 hidden sm:table-cell font-mono text-xs">{s.studentId}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      {s.tempPassword
                        ? <span className="font-mono text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">{s.tempPassword}</span>
                        : <span className="text-xs text-ink-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-ink-600 hidden lg:table-cell">{s.enrolledCourses?.length || 0}</td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <StatusBadge status={s.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => handleDeleteOne(s.id, s.fullName)}
                          className="p-1.5 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete student"
                        >
                          <Trash2 size={14} />
                        </button>
                        <Link
                          to={`/admin/students/${s.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: 'rgba(6,133,98,0.08)', color: '#068562', border: '1px solid rgba(6,133,98,0.15)' }}
                        >
                          View <ChevronRight size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={PAGE_SIZE}
          onPage={(p) => { setPage(p); load(p, search); }}
        />
      </div>
    </div>
  );
}
