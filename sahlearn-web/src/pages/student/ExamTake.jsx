// sahlearn-web/src/pages/student/ExamTake.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExam, submitExam } from '../../services/studentExams.service';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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
          const isWrong = q.type === 'mcq' && answer !== undefined && !isCorrect;

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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(null);

  useEffect(() => {
    getExam(id)
      .then((res) => {
        setData(res);
        if (res.myAttempt) {
          setAttempt(res.myAttempt);
          setSubmitted(true);
        }
      })
      .catch(() => toast.error('Failed to load exam'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSelect = (qIndex, selectedIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: { ...prev[qIndex], questionIndex: qIndex, selectedIndex } }));
  };

  const handleText = (qIndex, textAnswer) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: { ...prev[qIndex], questionIndex: qIndex, textAnswer } }));
  };

  const handleSubmit = async () => {
    const answersArray = Object.values(answers);
    if (!window.confirm('Submit your exam? You cannot change answers after submission.')) return;
    setSubmitting(true);
    try {
      const result = await submitExam(id, answersArray);
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
        <h1 className="text-xl font-display text-ink-900">{exam.title}</h1>
        <p className="text-sm text-ink-400 mt-0.5">{exam.course?.title}</p>
        {exam.description && <p className="text-sm text-ink-600 mt-3">{exam.description}</p>}
        <div className="flex items-center gap-4 mt-3 text-xs text-ink-400">
          <span>{exam.questions?.length || 0} questions</span>
          <span>{exam.totalPoints} points total</span>
          {exam.duration && <span>{exam.duration} min suggested</span>}
          {exam.dueDate && (
            <span>Due {new Date(exam.dueDate).toLocaleDateString('en-NG')}</span>
          )}
        </div>
      </div>

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
