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
          <>
            {/* Mobile: one card per submission, so phone, ID, time and submitted-at stay visible. */}
            <ul className="lg:hidden divide-y divide-surface-100">
              {results.map((entry) => (
                <li key={entry.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-100 text-ink-700 text-xs font-bold flex items-center justify-center">
                      {entry.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-ink-900 break-words">
                          {entry.fullName}
                          {!entry.isStudent && (
                            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-surface-100 text-ink-500">
                              Guest
                            </span>
                          )}
                        </p>
                        <span className="flex-shrink-0 text-sm font-bold text-ink-900">
                          {entry.score}/{entry.maxScore}
                        </span>
                      </div>

                      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                        <div className="flex gap-1.5 min-w-0">
                          <dt className="text-ink-400">Phone</dt>
                          <dd className="font-mono text-ink-600 truncate">{entry.phone || '—'}</dd>
                        </div>
                        <div className="flex gap-1.5 min-w-0">
                          <dt className="text-ink-400">ID</dt>
                          <dd className="font-mono text-ink-600 truncate">{entry.studentId || '—'}</dd>
                        </div>
                        <div className="flex gap-1.5 min-w-0">
                          <dt className="text-ink-400">Time</dt>
                          <dd className="text-ink-600">{formatDuration(entry.durationMs)}</dd>
                        </div>
                        <div className="flex gap-1.5 min-w-0">
                          <dt className="text-ink-400">Sent</dt>
                          <dd className="text-ink-600 truncate">
                            {entry.submittedAt
                              ? new Date(entry.submittedAt).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </dd>
                        </div>
                      </dl>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        {entry.pendingEssays > 0 ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            {entry.pendingEssays} to mark
                          </span>
                        ) : (
                          <span />
                        )}
                        <Link
                          to={`/admin/daily-quizzes/${id}/attempts/${entry.id}`}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                            entry.pendingEssays > 0
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-surface-100 text-ink-600 border-surface-300'
                          }`}
                        >
                          {entry.pendingEssays > 0 ? 'Mark' : 'View'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

          <table className="w-full text-sm hidden lg:table">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-left">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Rank</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Name</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Phone</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Student ID</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Score</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Time</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Submitted at</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 text-right">Answers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {results.map((entry) => (
                <tr key={entry.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-ink-900">{entry.rank}</td>
                  <td className="px-5 py-3.5 text-ink-700">
                    {entry.fullName}
                    {!entry.isStudent && (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-surface-100 text-ink-500">
                        Guest
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-ink-500 font-mono">{entry.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-ink-500 font-mono">{entry.studentId}</td>
                  <td className="px-5 py-3.5 text-ink-900 font-semibold">
                    {entry.score} / {entry.maxScore}
                    {entry.pendingEssays > 0 && (
                      <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">
                        {entry.pendingEssays} to mark
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-ink-500">{formatDuration(entry.durationMs)}</td>
                  <td className="px-5 py-3.5 text-ink-500">
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
          </>
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
