import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAssignments, deleteAssignment } from '../../services/adminAssignments.service';
import { Plus, ClipboardList, Users, Pencil, Trash2 } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Assignments</h1>
          <p className="text-sm text-ink-400">{meta.total} total</p>
        </div>
        <Link
          to="/admin/assignments/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition"
        >
          <Plus size={15} /> New Assignment
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList size={36} className="mx-auto text-ink-300 mb-2" />
            <p className="text-sm text-ink-400">No assignments yet.</p>
            <Link to="/admin/assignments/new" className="mt-2 inline-block text-sm text-brand-primary hover:underline">Create one</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 text-left">
                <th className="px-4 py-3 font-medium text-ink-500">Assignment</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden md:table-cell">Course</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden lg:table-cell">Due</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden sm:table-cell">Submissions</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {assignments.map((a) => (
                <tr key={a._id} className="hover:bg-surface-50 transition">
                  <td className="px-4 py-3">
                    <Link to={`/admin/assignments/${a._id}`} className="font-medium text-ink-900 hover:text-brand-primary transition">
                      {a.title}
                    </Link>
                    {!a.isPublished && (
                      <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-200 text-ink-500">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-500 hidden md:table-cell">{a.course?.title}</td>
                  <td className="px-4 py-3 text-ink-500 hidden lg:table-cell text-xs">
                    {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                      <Users size={12} /> {a.submissionCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/assignments/${a._id}/edit`} className="p-1.5 text-ink-400 hover:text-ink-900 transition">
                        <Pencil size={14} />
                      </Link>
                      <button onClick={() => handleDelete(a._id, a.title)} className="p-1.5 text-ink-400 hover:text-red-600 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-sm border border-surface-300 rounded-xl disabled:opacity-40 hover:bg-surface-100 transition">Prev</button>
          <span className="px-3 py-1.5 text-sm text-ink-500">{page} / {meta.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page === meta.totalPages} className="px-3 py-1.5 text-sm border border-surface-300 rounded-xl disabled:opacity-40 hover:bg-surface-100 transition">Next</button>
        </div>
      )}
    </div>
  );
}
