import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDailyQuiz, getDailyQuizResults } from '../../services/adminDailyQuizzes.service';
import { formatDuration } from '../../services/dailyQuiz.service';
import toast from 'react-hot-toast';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { Trophy } from 'lucide-react';

const PAGE_SIZE = 50;

export default function DailyQuizResults() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDailyQuiz(id)
      .then(setQuiz)
      .catch(() => toast.error('Failed to load quiz'));
  }, [id]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDailyQuizResults(id, { page, limit: PAGE_SIZE });
      setResults(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [id, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 text-xs text-ink-400">
        <Link to="/admin/daily-quizzes" className="hover:text-ink-900 transition">Daily Quizzes</Link>
        <span>›</span>
        <span className="font-semibold" style={{ color: '#068562' }}>{quiz?.title || 'Results'}</span>
      </div>

      <div>
        <h1 className="text-2xl font-display text-ink-900">
          {quiz?.title || 'Quiz results'}
          {quiz?.date && <span className="text-ink-400 font-normal text-base"> — {quiz.date}</span>}
        </h1>
        <p className="text-xs text-ink-400 mt-0.5">{meta.total} submission{meta.total !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-white rounded-2xl border border-ink-300/20 overflow-hidden shadow-card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No submissions yet"
            description="Nobody has taken this quiz yet."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-left">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Rank</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Name</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden sm:table-cell">Student ID</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Score</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden md:table-cell">Time</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden lg:table-cell">Submitted at</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 text-right">Answers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {results.map((entry) => (
                <tr key={entry.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-ink-900">{entry.rank}</td>
                  <td className="px-5 py-3.5 text-ink-700">{entry.fullName}</td>
                  <td className="px-5 py-3.5 text-ink-500 font-mono hidden sm:table-cell">{entry.studentId}</td>
                  <td className="px-5 py-3.5 text-ink-900 font-semibold">
                    {entry.score} / {entry.maxScore}
                    {entry.pendingEssays > 0 && (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">
                        {entry.pendingEssays} to mark
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-ink-500 hidden md:table-cell">{formatDuration(entry.durationMs)}</td>
                  <td className="px-5 py-3.5 text-ink-500 hidden lg:table-cell">
                    {entry.submittedAt ? new Date(entry.submittedAt).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      to={`/admin/daily-quizzes/${id}/attempts/${entry.id}`}
                      className={`text-xs font-medium hover:underline ${
                        entry.pendingEssays > 0 ? 'text-amber-700' : 'text-brand-primary'
                      }`}
                    >
                      {entry.pendingEssays > 0 ? 'Mark' : 'View'}
                    </Link>
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
