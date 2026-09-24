import { useState } from 'react';
import { getScoresByPhone, formatDuration } from '../../services/dailyQuiz.service';

// Lets someone with no account see their own past results. The API returns the
// same empty result for an unknown number as for a known one with no attempts,
// so nothing here can tell a visitor whether a number is in the database.
export default function QuizScoreLookup() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [entries, setEntries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    setEntries(null);
    try {
      const data = await getScoresByPhone(phone.trim());
      setEntries(data.entries || []);
    } catch (err) {
      const body = err.response?.data;
      setError(body?.errors?.[0]?.message || body?.message || 'Could not check that number.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-brand-primary hover:underline"
      >
        Check my past scores
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-ink-300/40 p-6">
      <h2 className="font-semibold text-ink-900 mb-1">Check my past scores</h2>
      <p className="text-sm text-ink-500 mb-4">
        Enter the phone number you used to take the quiz.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 08012345678"
          aria-label="Phone number"
          className="flex-1 border border-ink-300 rounded-lg px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-lg hover:bg-brand-primary/90 transition disabled:opacity-60"
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </form>

      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}

      {entries !== null && !error && (
        <div className="mt-4">
          {entries.length === 0 ? (
            <p className="text-sm text-ink-500">
              No quiz results for that number yet.
            </p>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => (
                <div
                  key={`${e.date}-${e.submittedAt}`}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-ink-300/20 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-ink-900 truncate">{e.title}</p>
                    <p className="text-xs text-ink-400">{e.date}</p>
                  </div>
                  <div className="flex items-center gap-4 text-ink-500 flex-shrink-0">
                    <span className="text-ink-900 font-medium">
                      {e.score}/{e.maxScore}
                      {e.pendingEssays > 0 && (
                        <span className="ml-1 text-xs text-amber-600" title="Written answers not marked yet">
                          *
                        </span>
                      )}
                    </span>
                    <span>{formatDuration(e.durationMs)}</span>
                  </div>
                </div>
              ))}
              {entries.some((e) => e.pendingEssays > 0) && (
                <p className="text-xs text-ink-400 pt-2">
                  * written answers on this one are still waiting to be marked
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
