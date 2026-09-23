import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getTodayQuiz, submitQuiz, formatDuration } from '../../services/dailyQuiz.service';
import SEO from '../../components/common/SEO';
import Button from '../../components/common/Button';
import QuizIdForm from '../../components/quiz/QuizIdForm';
import QuizQuestion from '../../components/quiz/QuizQuestion';
import QuizResult from '../../components/quiz/QuizResult';
import QuizLeaderboard from '../../components/quiz/QuizLeaderboard';

const SEO_PROPS = {
  title: 'Daily Quiz',
  description: "Take today's Sahlearn daily quiz. Five to ten quick questions, instant score.",
  url: '/quiz',
};

export default function DailyQuiz() {
  // loading -> unavailable | idle -> taking -> done
  const [phase, setPhase] = useState('loading');
  const [today, setToday] = useState(null);
  const [loadError, setLoadError] = useState('');

  // attemptToken lives only here, in memory — never in localStorage. The
  // attempt is resumable from the student ID alone if the page refreshes.
  const [attempt, setAttempt] = useState(null); // { attemptToken, date, title, description, startedAt, questions }
  const [answers, setAnswers] = useState({}); // { [questionIndex]: selectedIndex }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [result, setResult] = useState(null); // submit payload, or the 409 partial result

  useEffect(() => {
    getTodayQuiz()
      .then((data) => {
        setToday(data);
        setPhase(data?.available ? 'idle' : 'unavailable');
      })
      .catch((err) => {
        setLoadError(err.response?.data?.message || "Could not load today's quiz. Please try again.");
        setPhase('unavailable');
      });
  }, []);

  // Display-only stopwatch, driven by the server's startedAt. It never
  // blocks submission and the server alone computes the recorded duration.
  useEffect(() => {
    if (phase !== 'taking' || !attempt?.startedAt) return;
    const start = new Date(attempt.startedAt).getTime();
    const tick = () => setElapsedMs(Date.now() - start);
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phase, attempt]);

  const handleStarted = useCallback((data) => {
    setAttempt(data);
    setAnswers({});
    setCurrentIndex(0);
    setPhase('taking');
  }, []);

  const handleAlreadySubmitted = useCallback((data) => {
    setResult({ ...data, alreadySubmitted: true });
    setPhase('done');
  }, []);

  const handleSelect = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (!attempt || submitting) return;
    setSubmitting(true);
    try {
      const answersArray = Object.entries(answers).map(([questionIndex, selectedIndex]) => ({
        questionIndex: Number(questionIndex),
        selectedIndex,
      }));
      const submitResult = await submitQuiz(attempt.attemptToken, answersArray);
      setResult(submitResult);
      setPhase('done');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 401) {
        toast.error(message || 'Your quiz session has expired. Start again.');
        setAttempt(null);
        setPhase('idle');
      } else if (status === 409) {
        toast.error(message || 'This attempt was already submitted.');
        setAttempt(null);
        setPhase('idle');
      } else if (status === 429) {
        toast.error(message || 'Too many attempts. Please try again shortly.');
      } else {
        toast.error(message || 'Could not submit your answers. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (phase === 'loading') {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (phase === 'unavailable') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SEO {...SEO_PROPS} />
        <h1 className="text-3xl md:text-4xl font-bold text-ink-900 font-display mb-6">Daily Quiz</h1>
        <div className="bg-white rounded-2xl border border-ink-300/40 p-8 text-center mb-8">
          <p className="text-ink-700">{loadError || 'No quiz today. Check back tomorrow.'}</p>
        </div>
        <QuizLeaderboard date={today?.date} />
      </div>
    );
  }

  const totalQuestions = attempt?.questions?.length || 0;
  const currentQuestion = attempt?.questions?.[currentIndex];
  const isLast = currentIndex === totalQuestions - 1;
  const pageTitle = phase === 'idle' ? today?.title : attempt?.title;
  const pageDescription = phase === 'idle' ? today?.description : attempt?.description;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO {...SEO_PROPS} />
      <h1 className="text-3xl md:text-4xl font-bold text-ink-900 font-display mb-2">
        {pageTitle || 'Daily Quiz'}
      </h1>

      {phase === 'idle' && (
        <div className="space-y-6">
          {pageDescription && <p className="text-ink-500">{pageDescription}</p>}
          <p className="text-sm text-ink-400">
            {today?.questionCount} question{today?.questionCount === 1 ? '' : 's'} · {today?.totalPoints}{' '}
            points total
          </p>
          <QuizIdForm onStarted={handleStarted} onAlreadySubmitted={handleAlreadySubmitted} />
        </div>
      )}

      {phase === 'taking' && currentQuestion && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 h-2 bg-ink-300/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-primary transition-all"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-sm text-ink-500 flex-shrink-0">Time: {formatDuration(elapsedMs)}</span>
          </div>

          <QuizQuestion
            question={currentQuestion}
            index={currentIndex}
            total={totalQuestions}
            selectedIndex={answers[currentIndex] ?? null}
            onSelect={handleSelect}
          />

          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </Button>
            {isLast ? (
              <Button type="button" onClick={handleSubmit} loading={submitting} disabled={submitting}>
                Submit
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      )}

      {phase === 'done' && result && <QuizResult result={result} questions={attempt?.questions} />}
    </div>
  );
}
