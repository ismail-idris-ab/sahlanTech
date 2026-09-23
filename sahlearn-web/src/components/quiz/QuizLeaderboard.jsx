import { useEffect, useState } from 'react';
import { getLeaderboard, formatDuration } from '../../services/dailyQuiz.service';

export default function QuizLeaderboard({ date }) {
  // null = still loading or failed — render nothing in both cases, the
  // leaderboard is secondary to the quiz itself.
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    let active = true;
    getLeaderboard(date)
      .then((data) => {
        if (active) setEntries(Array.isArray(data?.entries) ? data.entries : []);
      })
      .catch(() => {
        if (active) setEntries(null);
      });
    return () => {
      active = false;
    };
  }, [date]);

  if (entries === null) return null;

  return (
    <div className="bg-white rounded-2xl border border-ink-300/40 p-6">
      <h2 className="font-semibold text-ink-900 mb-4">Today's top scores</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-ink-500">Nobody has finished yet today. Be first.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className="flex items-center justify-between text-sm py-1.5 border-b border-ink-300/20 last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-ink-400 font-medium w-6 flex-shrink-0">{entry.rank}</span>
                <span className="text-ink-900 truncate">{entry.fullName}</span>
              </div>
              <div className="flex items-center gap-4 text-ink-500 flex-shrink-0">
                <span>
                  {entry.score}/{entry.maxScore}
                  {/* This score can still rise: written answers on it are not marked yet. */}
                  {entry.pending && (
                    <span className="ml-1 text-xs text-amber-600" title="Written answers not marked yet">
                      *
                    </span>
                  )}
                </span>
                <span>{formatDuration(entry.durationMs)}</span>
              </div>
            </div>
          ))}
          {entries.some((e) => e.pending) && (
            <p className="text-xs text-ink-400 pt-2">* still has written answers waiting to be marked</p>
          )}
        </div>
      )}
    </div>
  );
}
