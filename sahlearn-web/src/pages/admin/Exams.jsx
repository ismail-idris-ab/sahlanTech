import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getExams, deleteExam } from '../../services/adminExams.service';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';

const PAGE_SIZE = 20;

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Exams</h1>
          <p className="text-xs text-ink-400 mt-0.5">{meta.total} total</p>
        </div>
        <Link
          to="/admin/exams/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #068562, #056B4E)' }}
        >
          <Plus size={15} /> New Exam
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-ink-300/20 overflow-hidden shadow-card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="py-16 text-center text-sm text-ink-400">No exams yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-left">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Title</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden sm:table-cell">Course</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden md:table-cell">Due Date</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden lg:table-cell">Attempts</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-ink-900">{exam.title}</td>
                  <td className="px-5 py-3.5 text-ink-500 hidden sm:table-cell">{exam.course?.title || '—'}</td>
                  <td className="px-5 py-3.5 text-ink-500 hidden md:table-cell">
                    {exam.dueDate ? new Date(exam.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-ink-600 hidden lg:table-cell">{exam.attemptCount ?? 0}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        to={`/admin/exams/${exam.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                        style={{ background: 'rgba(6,133,98,0.08)', color: '#068562', border: '1px solid rgba(6,133,98,0.15)' }}
                      >
                        <ChevronRight size={12} /> Review
                      </Link>
                      <Link
                        to={`/admin/exams/${exam.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-surface-100 text-ink-600 border border-surface-300 hover:bg-surface-200 transition"
                      >
                        <Pencil size={12} /> Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(exam)}
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
        <Pagination
          page={page}
          totalPages={meta.totalPages}
          total={meta.total}
          pageSize={PAGE_SIZE}
          onPage={setPage}
        />
      </div>
    </div>
  );
}
