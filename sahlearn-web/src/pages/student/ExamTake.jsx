// sahlearn-web/src/pages/student/ExamTake.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExam, submitExam } from '../../services/studentExams.service';
import { ArrowLeft, CheckCircle2, XCircle, Timer } from 'lucide-react';
import toast from 'react-hot-toast';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

function TimerBadge({ timeLeft }) {
  if (timeLeft === null) return null;
  const isRed = timeLeft < 60;
  const isAmber = timeLeft < 300 && timeLeft >= 60;
  const cls = isRed
    ? 'bg-red-50 border border-red-200 text-red-700'
    : isAmber
    ? 'bg-amber-50 border border-amber-200 text-amber-700'
    : 'bg-green-50 border border-green-200 text-green-700';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-mono font-semibold ${cls}`}>
      <Timer size={14} />
      {formatTime(timeLeft)}
    </span>
  );
}

function ResultsView({ exam, attempt }) {
  const answersMap = Object.fromEntries(
    (attempt.answers || []).map((a) => [a.questionIndex, a])
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <h2 className="font-semibold text-ink-900 text-lg mb-1">Your Results</h2>
        <p className="text-3xl font-bold text-brand-primary">
          {attempt.score} <span className="text-lg font-normal text-ink-400">/ {attempt.maxScore}</span>
        </p>
        <p className="text-sm text-ink-400 mt-1">
          Status: <span className="capitalize font-medium text-ink-700">{attempt.status}</span>
        </p>
        {attempt.adminNote && (
          <div className="mt-4 p-3 bg-surface-100 rounded-xl text-sm text-ink-700">
            <span className="font-medium text-ink-500 block text-xs uppercase tracking-wide mb-1">Admin Note</span>
            {attempt.adminNote}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {exam.questions.map((q, i) => {
          const answer = answersMap[i];
          const isCorrect = q.type === 'mcq' && answer?.selectedIndex === q.correctIndex;

          return (
            <div key={i} className="bg-white rounded-2xl border border-surface-200 p-5">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-xs font-medium text-ink-400 flex-shrink-0 mt-0.5">Q{i + 1}</span>
                <p className="text-sm font-medium text-ink-900 flex-1">{q.text}</p>
                {q.type === 'mcq' && (
                  isCorrect
                    ? <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                    : <XCircle size={16} className="text-red-500 flex-shrink-0" />
                )}
              </div>

              {q.type === 'mcq' && (
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => {
                    const isSelected = answer?.selectedIndex === oi;
                    const isCorrectOption = q.correctIndex === oi;
                    let cls = 'px-3 py-2 rounded-xl text-sm border ';
                    if (isCorrectOption) cls += 'bg-green-50 border-green-200 text-green-800';
                    else if (isSelected && !isCorrectOption) cls += 'bg-red-50 border-red-200 text-red-700';
                    else cls += 'border-surface-200 text-ink-600';
                    return (
                      <div key={oi} className={cls}>
                        {opt}
                        {isCorrectOption && <span className="ml-2 text-xs font-medium">(correct)</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'short' && answer?.textAnswer && (
                <div className="mt-2 p-3 bg-surface-100 rounded-xl text-sm text-ink-700">
                  <span className="text-xs text-ink-400 block mb-1">Your answer:</span>
                  {answer.textAnswer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ExamTake() {
  const { id } = useParams();
  const timerKey = `sahlearn_exam_start_${id}`;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // Keep a ref to answers so the timer interval can read the latest value
  const answersRef = useRef({});
  useEffect(() => { answersRef.current = answers; }, [answers]);

  // Core submit logic — shared by manual submit and auto-submit
  const doSubmit = useCallback(async (answersArray) => {
    setSubmitting(true);
    try {
      const result = await submitExam(id, answersArray);
      localStorage.removeItem(timerKey);
      setAttempt(result);
      setSubmitted(true);
      const updated = await getExam(id);
      setData(updated);
      toast.success('Exam submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [id, timerKey]);

  // Load exam
  useEffect(() => {
    getExam(id)
      .then((res) => {
        setData(res);
        if (res.myAttempt) {
          setAttempt(res.myAttempt);
          setSubmitted(true);
          localStorage.removeItem(`sahlearn_exam_start_${id}`);
        }
      })
      .catch(() => toast.error('Failed to load exam'))
      .finally(() => setLoading(false));
  }, [id]);

  // Start timer once exam data is loaded and not yet submitted
  useEffect(() => {
    if (!data?.exam || submitted || !data.exam.duration) return;

    const duration = data.exam.duration * 60; // convert minutes to seconds

    let startedAt = parseInt(localStorage.getItem(timerKey), 10);
    if (!startedAt) {
      startedAt = Date.now();
      localStorage.setItem(timerKey, String(startedAt));
    }

    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const remaining = duration - elapsed;

    if (remaining <= 0) {
      // Expired before page loaded — auto-submit immediately
      toast('Time is up! Auto-submitting...', { icon: '⏱' });
      doSubmit(Object.values(answersRef.current));
      return;
    }

    setTimeLeft(remaining);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          toast('Time is up! Auto-submitting...', { icon: '⏱' });
          doSubmit(Object.values(answersRef.current));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [data, submitted, doSubmit]);

  const handleSubmit = async () => {
    if (!window.confirm('Submit your exam? You cannot change answers after submission.')) return;
    await doSubmit(Object.values(answers));
  };

  const handleSelect = (qIndex, selectedIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: { ...prev[qIndex], questionIndex: qIndex, selectedIndex } }));
  };

  const handleText = (qIndex, textAnswer) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: { ...prev[qIndex], questionIndex: qIndex, textAnswer } }));
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
        <Link to="/student/exams" className="text-brand-primary hover:underline">Back to exams</Link>
      </div>
    );
  }

  const { exam } = data;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/student/exams" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900 transition">
        <ArrowLeft size={14} /> Exams
      </Link>

      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-display text-ink-900">{exam.title}</h1>
            <p className="text-sm text-ink-400 mt-0.5">{exam.course?.title}</p>
            {exam.description && <p className="text-sm text-ink-600 mt-3">{exam.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-xs text-ink-400">
              <span>{exam.questions?.length || 0} questions</span>
              <span>{exam.totalPoints} points total</span>
              {exam.duration && <span>{exam.duration} min</span>}
              {exam.dueDate && (
                <span>Due {new Date(exam.dueDate).toLocaleDateString('en-NG')}</span>
              )}
            </div>
          </div>
          {!submitted && <TimerBadge timeLeft={timeLeft} />}
        </div>
      </div>

      {/* Warning banner at 5 minutes */}
      {!submitted && timeLeft !== null && timeLeft <= 300 && timeLeft > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <Timer size={15} className="flex-shrink-0" />
          <span>
            {timeLeft <= 60
              ? 'Less than 1 minute remaining — your exam will auto-submit soon.'
              : 'Less than 5 minutes remaining — your exam will auto-submit when time runs out.'}
          </span>
        </div>
      )}

      {submitted && attempt ? (
        <ResultsView exam={exam} attempt={attempt} />
      ) : (
        <>
          <div className="space-y-4">
            {exam.questions.map((q, i) => (
              <div key={i} className="bg-white rounded-2xl border border-surface-200 p-5">
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-xs font-medium text-ink-400 flex-shrink-0 mt-0.5">Q{i + 1} · {q.points}pt</span>
                  <p className="text-sm font-medium text-ink-900 flex-1">{q.text}</p>
                </div>

                {q.type === 'mcq' && (
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const selected = answers[i]?.selectedIndex === oi;
                      return (
                        <button
                          key={oi}
                          onClick={() => handleSelect(i, oi)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition ${
                            selected
                              ? 'bg-brand-primary/10 border-brand-primary text-brand-primary font-medium'
                              : 'border-surface-200 text-ink-700 hover:bg-surface-50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'short' && (
                  <textarea
                    value={answers[i]?.textAnswer || ''}
                    onChange={(e) => handleText(i, e.target.value)}
                    rows={3}
                    placeholder="Write your answer here..."
                    className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="pb-8">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
