import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { listDailyQuizzes, deleteDailyQuiz } from '../../services/adminDailyQuizzes.service';
import { Plus, Pencil, Trash2, ListChecks, CalendarClock } from 'lucide-react';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

const PAGE_SIZE = 20;

export default function DailyQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listDailyQuizzes({ page, limit: PAGE_SIZE });
      setQuizzes(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load daily quizzes');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteDailyQuiz(pendingDelete.id);
      toast.success('Quiz deleted');
      setPendingDelete(null);
      load();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Daily Quizzes</h1>
          <p className="text-xs text-ink-400 mt-0.5">{meta.total} total</p>
        </div>
        <Link
          to="/admin/daily-quizzes/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #068562, #056B4E)' }}
        >
          <Plus size={15} /> New quiz
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-ink-300/20 overflow-hidden shadow-card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : quizzes.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No quizzes yet"
            description="No quizzes yet — create today's."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-left">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Date</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Title</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden sm:table-cell">Questions</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden md:table-cell">Status</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden lg:table-cell">Attempts</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-ink-900">{quiz.date}</td>
                  <td className="px-5 py-3.5 text-ink-700">{quiz.title}</td>
                  <td className="px-5 py-3.5 text-ink-500 hidden sm:table-cell">{quiz.questionCount ?? 0}</td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <StatusBadge status={quiz.isPublished ? 'published' : 'draft'} />
                  </td>
                  <td className="px-5 py-3.5 text-ink-600 hidden lg:table-cell">{quiz.attemptCount ?? 0}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        to={`/admin/daily-quizzes/${quiz.id}/results`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                        style={{ background: 'rgba(6,133,98,0.08)', color: '#068562', border: '1px solid rgba(6,133,98,0.15)' }}
                      >
                        <ListChecks size={12} /> Results
                      </Link>
                      <Link
                        to={`/admin/daily-quizzes/${quiz.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-surface-100 text-ink-600 border border-surface-300 hover:bg-surface-200 transition"
                      >
                        <Pencil size={12} /> Edit
                      </Link>
                      <button
                        onClick={() => setPendingDelete(quiz)}
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

      <Modal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete quiz"
      >
        <p className="text-sm text-ink-600">
          Delete "{pendingDelete?.title}"? All attempts for this quiz will also be deleted.
        </p>
        <div className="flex gap-3 mt-5">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition disabled:opacity-60"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={() => setPendingDelete(null)}
            className="px-4 py-2 border border-surface-300 text-ink-700 font-medium rounded-xl hover:bg-surface-100 transition"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
}
