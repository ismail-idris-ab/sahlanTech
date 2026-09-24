import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getDailyQuizAttempt, gradeDailyQuizAttempt } from '../../services/adminDailyQuizzes.service';
import { formatDuration } from '../../services/dailyQuiz.service';

export default function DailyQuizGrade() {
  const { id, attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // { [questionIndex]: string } — kept as typed text so the field can be
  // cleared while editing without snapping back to 0.
  const [marks, setMarks] = useState({});

  useEffect(() => {
    getDailyQuizAttempt(id, attemptId)
      .then((data) => {
        setAttempt(data);
        const initial = {};
        data.questions
          .filter((q) => q.type === 'essay')
          .forEach((q) => {
            initial[q.questionIndex] = q.graded && q.awardedPoints != null ? String(q.awardedPoints) : '';
          });
        setMarks(initial);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load this attempt');
        navigate(`/admin/daily-quizzes/${id}/results`);
      })
      .finally(() => setLoading(false));
  }, [id, attemptId, navigate]);

  const essays = (attempt?.questions || []).filter((q) => q.type === 'essay');

  const handleSave = async () => {
    const grades = [];
    for (const q of essays) {
      const raw = (marks[q.questionIndex] ?? '').trim();
      if (raw === '') continue; // left unmarked on purpose — skip, don't send 0
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) {
        toast.error(`Q${q.questionIndex + 1}: enter a mark of 0 or more`);
        return;
      }
      if (value > q.points) {
        toast.error(`Q${q.questionIndex + 1} is worth at most ${q.points}`);
        return;
      }
      grades.push({ questionIndex: q.questionIndex, awardedPoints: value });
    }

    if (grades.length === 0) {
      toast.error('Enter at least one mark');
      return;
    }

    setSaving(true);
    try {
      const updated = await gradeDailyQuizAttempt(id, attemptId, grades);
      toast.success(
        updated.pendingEssays > 0
          ? `Saved. ${updated.pendingEssays} answer${updated.pendingEssays === 1 ? '' : 's'} still unmarked.`
          : 'Saved. This attempt is fully marked.'
      );
      const fresh = await getDailyQuizAttempt(id, attemptId);
      setAttempt(fresh);
    } catch (err) {
      const fieldError = err.response?.data?.errors?.[0]?.message;
      toast.error(fieldError || err.response?.data?.message || 'Could not save these marks');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!attempt) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 text-xs text-ink-400">
        <Link to="/admin/daily-quizzes" className="hover:text-ink-900 transition">Daily Quizzes</Link>
        <span>›</span>
        <Link to={`/admin/daily-quizzes/${id}/results`} className="hover:text-ink-900 transition">
          {attempt.quizTitle || 'Results'}
        </Link>
        <span>›</span>
        <span className="font-semibold" style={{ color: '#068562' }}>{attempt.fullName}</span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">{attempt.fullName}</h1>
          <p className="text-xs text-ink-400 mt-0.5">
            <span className="font-mono">{attempt.studentId}</span> · {attempt.date} ·{' '}
            {formatDuration(attempt.durationMs)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-ink-900">
            {attempt.score} <span className="text-base font-normal text-ink-400">/ {attempt.maxScore}</span>
          </p>
          <p className="text-xs text-ink-400">
            {attempt.pendingEssays > 0
              ? `${attempt.pendingEssays} answer${attempt.pendingEssays === 1 ? '' : 's'} to mark`
              : 'Fully marked'}
          </p>
        </div>
      </div>

      {essays.length === 0 && (
        <div className="bg-white rounded-2xl border border-ink-300/20 p-6 text-sm text-ink-500 shadow-card">
          This quiz is multiple choice only — it was marked automatically, so there is nothing to grade here.
        </div>
      )}

      <div className="space-y-4">
        {attempt.questions.map((q) => {
          const isEssay = q.type === 'essay';
          return (
            <div key={q.questionIndex} className="bg-white rounded-2xl border border-ink-300/20 p-5 shadow-card">
              <div className="flex items-start justify-between gap-3 mb-3">
                <p className="text-sm font-medium text-ink-900">
                  Q{q.questionIndex + 1}. {q.text}
                </p>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${
                    isEssay ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {isEssay ? 'Essay' : 'MCQ'}
                </span>
              </div>

              {isEssay ? (
                <>
                  <p className="text-xs font-medium text-ink-400 mb-1">Their answer</p>
                  <p className="text-sm text-ink-700 whitespace-pre-wrap bg-surface-50 border border-surface-200 rounded-xl px-4 py-3">
                    {q.answerText || <span className="text-ink-400 italic">Left blank.</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <label className="text-xs font-medium text-ink-600" htmlFor={`mark-${q.questionIndex}`}>
                      Mark
                    </label>
                    <input
                      id={`mark-${q.questionIndex}`}
                      type="number"
                      min={0}
                      max={q.points}
                      step="any"
                      value={marks[q.questionIndex] ?? ''}
                      onChange={(e) => setMarks((prev) => ({ ...prev, [q.questionIndex]: e.target.value }))}
                      className="w-24 px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                    />
                    <span className="text-xs text-ink-400">out of {q.points}</span>
                    {q.graded && (
                      <span className="text-xs text-green-600 font-medium ml-2">
                        Marked {q.awardedPoints} / {q.points}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => {
                    const chosen = q.selectedIndex === oi;
                    const correct = q.correctIndex === oi;
                    let cls = 'flex items-center gap-3 px-3 py-2 rounded-xl text-sm border ';
                    if (correct) cls += 'bg-green-50 border-green-200 text-green-800';
                    else if (chosen) cls += 'bg-red-50 border-red-200 text-red-700';
                    else cls += 'border-surface-200 text-ink-600';
                    return (
                      <div key={oi} className={cls}>
                        <span className="flex-1">{opt}</span>
                        {correct && <span className="text-xs font-semibold flex-shrink-0">Correct</span>}
                        {chosen && !correct && (
                          <span className="text-xs font-semibold flex-shrink-0">Their answer</span>
                        )}
                      </div>
                    );
                  })}
                  {q.selectedIndex === null && (
                    <p className="text-xs text-ink-400 italic">They skipped this question.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {essays.length > 0 && (
        <div className="flex justify-end gap-3">
          <Link
            to={`/admin/daily-quizzes/${id}/results`}
            className="px-5 py-2.5 text-sm font-medium text-ink-700 bg-surface-100 rounded-xl hover:bg-surface-200 transition"
          >
            Back to results
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save marks'}
          </button>
        </div>
      )}
    </div>
  );
}
