import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getExams, deleteExam } from '../../services/adminExams.service';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getExams({ page });
      setExams(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (exam) => {
    if (!window.confirm(`Delete "${exam.title}"? All attempts will also be deleted.`)) return;
    try {
      await deleteExam(exam.id);
      toast.success('Exam deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Exams</h1>
          <p className="text-sm text-ink-400">{meta.total} total</p>
        </div>
        <Link
          to="/admin/exams/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition"
        >
          <Plus size={15} /> New Exam
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="py-12 text-center text-ink-400 text-sm">No exams yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 text-left">
                <th className="px-4 py-3 font-medium text-ink-500">Exam</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden sm:table-cell">Course</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden md:table-cell">Questions</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden md:table-cell">Attempts</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden lg:table-cell">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-surface-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{exam.title}</p>
                    {exam.dueDate && (
                      <p className="text-xs text-ink-400">
                        Due {new Date(exam.dueDate).toLocaleDateString('en-NG')}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-500 hidden sm:table-cell">{exam.course?.title}</td>
                  <td className="px-4 py-3 text-ink-500 hidden md:table-cell">{exam.questions?.length || 0}</td>
                  <td className="px-4 py-3 text-ink-500 hidden md:table-cell">{exam.attemptCount || 0}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {exam.isPublished ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">Published</span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-200 text-ink-500">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/admin/exams/${exam.id}/edit`}
                        className="p-1.5 rounded-lg hover:bg-surface-100 text-ink-400 hover:text-ink-900 transition"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => handleDelete(exam)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-600 transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                      <Link
                        to={`/admin/exams/${exam.id}`}
                        className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline font-medium"
                      >
                        View <ChevronRight size={13} />
                      </Link>
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
