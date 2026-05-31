import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAssignments, deleteAssignment } from '../../services/adminAssignments.service';
import { Plus, ClipboardList, Pencil, Trash2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAssignments({ page });
      setAssignments(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This will also delete all student submissions.`)) return;
    try {
      await deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a._id !== id));
      toast.success('Assignment deleted');
    } catch {
      toast.error('Failed to delete assignment');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Assignments</h1>
          <p className="text-xs text-ink-400 mt-0.5">{meta.total} total</p>
        </div>
        <Link
          to="/admin/assignments/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #068562, #056B4E)' }}
        >
          <Plus size={15} /> New Assignment
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-ink-300/20 overflow-hidden shadow-card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList size={36} className="mx-auto text-ink-300 mb-2" />
            <p className="text-sm text-ink-400">No assignments yet.</p>
            <Link to="/admin/assignments/new" className="mt-2 inline-block text-sm text-brand-primary hover:underline">Create one</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-left">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Title</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden md:table-cell">Course</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden lg:table-cell">Due Date</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden sm:table-cell">Submissions</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {assignments.map((a) => (
                <tr key={a._id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-ink-900">{a.title}</td>
                  <td className="px-5 py-3.5 text-ink-500 hidden md:table-cell">{a.course?.title || '—'}</td>
                  <td className="px-5 py-3.5 text-ink-500 hidden lg:table-cell">
                    {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-ink-600 hidden sm:table-cell">{a.submissionCount ?? 0}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        to={`/admin/assignments/${a._id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                        style={{ background: 'rgba(6,133,98,0.08)', color: '#068562', border: '1px solid rgba(6,133,98,0.15)' }}
                      >
                        <ChevronRight size={12} /> Review
                      </Link>
                      <Link
                        to={`/admin/assignments/${a._id}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-surface-100 text-ink-600 border border-surface-300 hover:bg-surface-200 transition"
                      >
                        <Pencil size={12} /> Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(a._id, a.title)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 bg-surface-50 border-t border-surface-200">
            <p className="text-xs text-ink-400">Page {page} of {meta.totalPages}</p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs font-medium border border-surface-300 rounded-lg disabled:opacity-40 hover:bg-surface-100 bg-white text-ink-600">← Prev</button>
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
              <button onClick={() => setPage((p) => p + 1)} disabled={page === meta.totalPages} className="px-3 py-1.5 text-xs font-medium border border-surface-300 rounded-lg disabled:opacity-40 hover:bg-surface-100 bg-white text-ink-600">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
