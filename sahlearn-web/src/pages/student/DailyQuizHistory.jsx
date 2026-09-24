// sahlearn-web/src/pages/student/DailyQuizHistory.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyQuizHistory, formatDuration } from '../../services/dailyQuiz.service';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';
import { CalendarClock, Trophy, Flame, Target } from 'lucide-react';

const PAGE_SIZE = 20;

export default function DailyQuizHistory() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [stats, setStats] = useState({ totalTaken: 0, averageScore: 0, bestScore: 0, currentStreak: 0 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyQuizHistory({ page, limit: PAGE_SIZE });
      setRows(res.data);
      setMeta(res.meta);
      setStats(res.stats);
    } catch {
      toast.error('Failed to load daily quiz history');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Daily Quiz</h1>
          <p className="text-xs text-ink-400 mt-0.5">Your daily quiz attempts and stats</p>
        </div>
        <Link
          to="/quiz"
          className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-sm font-semibold rounded-lg transition-colors flex-shrink-0"
        >
          Take today's quiz
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-surface-200 p-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(6,133,98,0.1)' }}>
            <CalendarClock size={16} className="text-brand-primary" />
          </div>
          <p className="text-2xl font-display text-ink-900 leading-none mb-1">{stats.totalTaken}</p>
          <p className="text-xs font-medium text-ink-500">Quizzes taken</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-200 p-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-blue-50">
            <Target size={16} className="text-blue-600" />
          </div>
          <p className="text-2xl font-display text-ink-900 leading-none mb-1">{stats.averageScore}</p>
          <p className="text-xs font-medium text-ink-500">Average score</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-200 p-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-purple-50">
            <Trophy size={16} className="text-purple-600" />
          </div>
          <p className="text-2xl font-display text-ink-900 leading-none mb-1">{stats.bestScore}</p>
          <p className="text-xs font-medium text-ink-500">Best score</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-200 p-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-orange-50">
            <Flame size={16} className="text-orange-600" />
          </div>
          <p className="text-2xl font-display text-ink-900 leading-none mb-1">{stats.currentStreak} days</p>
          <p className="text-xs font-medium text-ink-500">Current streak</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100">
          <p className="font-semibold text-ink-900">Quiz History</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="You have not taken a daily quiz yet."
            description="Take today's quiz to start building your streak."
            action={
              <Link to="/quiz" className="text-sm font-semibold text-brand-primary hover:underline">
                Go to today's quiz →
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 text-left text-xs text-ink-500 uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Quiz</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                  <th className="px-6 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-3 text-ink-600">{r.date}</td>
                    <td className="px-6 py-3 text-ink-900 font-medium">{r.title}</td>
                    <td className="px-6 py-3 text-ink-900 font-semibold">
                      {r.score} / {r.maxScore}
                      {r.pendingEssays > 0 && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">
                          Awaiting marking
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-ink-600">{formatDuration(r.durationMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
