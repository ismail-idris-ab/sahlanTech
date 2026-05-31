// sahlearn-web/src/pages/admin/ExamDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listAttempts, reviewAttempt } from '../../services/adminExams.service';
import { ClipboardCheck, Pencil, CheckCircle2, Clock, Download } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import { downloadFile } from '../../utils/download';
import toast from 'react-hot-toast';

function ReviewForm({ attempt, examQuestions, onReviewed }) {
  const [note, setNote] = useState(attempt.adminNote || '');
  const [saving, setSaving] = useState(false);

  // Build initial essay scores from existing attempt answers
  const initEssayScores = () => {
    const map = {};
    for (const a of attempt.answers || []) {
      if (a.essayScore != null) map[a.questionIndex] = String(a.essayScore);
    }
    return map;
  };
  const [essayScores, setEssayScores] = useState(initEssayScores);

  const hasShortQuestions = examQuestions.some((q) => q.type === 'short');

  const handleSave = async () => {
    setSaving(true);
    try {
      const essayPayload = Object.entries(essayScores)
        .map(([qi, pts]) => ({ questionIndex: Number(qi), points: Number(pts) || 0 }));

      const updated = await reviewAttempt(attempt.id, {
        adminNote: note,
        ...(hasShortQuestions && { essayScores: essayPayload }),
      });
      onReviewed(updated);
      toast.success('Review saved');
    } catch {
      toast.error('Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  const answersMap = Object.fromEntries(
    (attempt.answers || []).map((a) => [a.questionIndex, a])
  );

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-3">
        {examQuestions.map((q, i) => {
          const answer = answersMap[i];
          return (
            <div key={i} className="bg-surface-50 rounded-xl p-4">
              <p className="text-xs text-ink-400 mb-1">Q{i + 1} · {q.type.toUpperCase()} · {q.points}pt</p>
              <p className="text-sm font-medium text-ink-900 mb-2">{q.text}</p>

              {q.type === 'mcq' && (
                <div className="space-y-1">
                  {q.options.map((opt, oi) => {
                    const isSelected = answer?.selectedIndex === oi;
                    const isCorrect = q.correctIndex === oi;
                    let cls = 'px-2.5 py-1.5 rounded-lg text-xs border ';
                    if (isCorrect) cls += 'bg-green-50 border-green-200 text-green-800';
                    else if (isSelected && !isCorrect) cls += 'bg-red-50 border-red-200 text-red-700';
                    else cls += 'border-surface-200 text-ink-500';
                    return (
                      <div key={oi} className={cls}>
                        {opt}
                        {isSelected && <span className="ml-1.5 font-medium">(student)</span>}
                        {isCorrect && <span className="ml-1.5 font-medium">(correct)</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'short' && (
                <div className="space-y-2">
                  <div className="p-2.5 bg-white rounded-lg border border-surface-200 text-sm text-ink-700 min-h-[3rem]">
                    {answer?.textAnswer || <span className="text-ink-300 italic">No answer provided</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-ink-500 shrink-0">Score:</label>
                    <input
                      type="number"
                      min={0}
                      max={q.points}
                      value={essayScores[i] ?? ''}
                      onChange={(e) => setEssayScores((prev) => ({ ...prev, [i]: e.target.value }))}
                      placeholder="0"
                      className="w-20 px-2 py-1 border border-surface-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                    />
                    <span className="text-xs text-ink-400">/ {q.points}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-600 mb-1">Admin Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Add feedback or notes for this student..."
          className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
      >
        {saving ? 'Saving...' : attempt.status === 'reviewed' ? 'Update Review' : 'Save Grade'}
      </button>
    </div>
  );
}

export default function AdminExamDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedAttempt, setExpandedAttempt] = useState(null);

  useEffect(() => {
    listAttempts(id)
      .then(setData)
      .catch(() => toast.error('Failed to load attempts'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleReviewed = (updated) => {
    setData((prev) => ({
      ...prev,
      attempts: prev.attempts.map((a) => a.id === updated.id ? { ...a, ...updated } : a),
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.exam) {
    return (
      <div className="text-center py-12 text-ink-500">
        Exam not found.{' '}
        <Link to="/admin/exams" className="text-brand-primary hover:underline">Back to list</Link>
      </div>
    );
  }

  const { exam, attempts } = data;

  return (
    <div className="max-w-4xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-ink-400">
        <Link to="/admin/exams" className="hover:text-ink-900 transition">Exams</Link>
        <span>›</span>
        <span className="font-semibold" style={{ color: '#068562' }}>{exam.title}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: 'linear-gradient(135deg, #068562, #71B280)' }}
        >
          <ClipboardCheck size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display text-ink-900">{exam.title}</h1>
          <p className="text-xs text-ink-400 mt-0.5">{exam.course?.title}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge status={exam.published ? 'published' : 'draft'} />
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-100 text-ink-500 border border-surface-300">
              {exam.questions?.length || 0} questions · {exam.totalPoints} pts
            </span>
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {attempts.length} attempt{attempts.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <button
            onClick={async () => {
              try {
                await downloadFile(`/api/admin/exports/exams/${id}/results.csv`, `${exam.title}-results.csv`);
              } catch {
                toast.error('Failed to export results');
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-surface-100 text-ink-700 border border-surface-300 hover:bg-surface-200 transition"
          >
            <Download size={13} /> Export CSV
          </button>
          <Link
            to={`/admin/exams/${id}/edit`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-surface-100 text-ink-700 border border-surface-300 hover:bg-surface-200 transition"
          >
            <Pencil size={13} /> Edit
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="font-semibold text-ink-900">Attempts ({attempts.length})</h2>

        {attempts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-surface-200 p-8 text-center text-ink-400 text-sm">
            No submissions yet.
          </div>
        ) : (
          attempts.map((attempt) => {
            const isExpanded = expandedAttempt === attempt.id;
            const initials = attempt.student?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

            return (
              <div key={attempt.id} className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-surface-50 transition"
                  onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                >
                  {attempt.student?.avatar?.url ? (
                    <img src={attempt.student.avatar.url} alt={attempt.student.fullName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink-900">{attempt.student?.fullName}</p>
                    <p className="text-xs text-ink-400 font-mono">{attempt.student?.studentId}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-ink-900">{attempt.score} / {attempt.maxScore}</p>
                    <p className="text-xs text-ink-400">{new Date(attempt.submittedAt).toLocaleDateString('en-NG')}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                    attempt.status === 'reviewed' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {attempt.status === 'reviewed' ? <><CheckCircle2 size={11} /> Reviewed</> : <><Clock size={11} /> Pending</>}
                  </span>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-surface-100">
                    <ReviewForm
                      attempt={attempt}
                      examQuestions={exam.questions || []}
                      onReviewed={handleReviewed}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
