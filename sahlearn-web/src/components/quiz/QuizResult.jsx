import { Link } from 'react-router-dom';
import { formatDuration } from '../../services/dailyQuiz.service';
import QuizLeaderboard from './QuizLeaderboard';

export default function QuizResult({ result, questions }) {
  const hasReview = Array.isArray(result?.results) && Array.isArray(questions) && questions.length > 0;

  return (
    <div className="space-y-8">
      <div className="text-center bg-white rounded-2xl border border-ink-300/40 p-8">
        <p className="text-4xl font-bold text-brand-primary">
          {result.score} <span className="text-xl font-normal text-ink-400">/ {result.maxScore}</span>
        </p>
        <p className="text-sm text-ink-500 mt-2">Time: {formatDuration(result.durationMs)}</p>

        {result.alreadySubmitted && (
          <p className="text-sm text-ink-500 mt-3">You took today's quiz already.</p>
        )}

        <Link to="/student/login" className="inline-block mt-4 text-brand-primary hover:underline text-sm">
          Log in to see your full quiz history.
        </Link>
      </div>

      {hasReview && (
        <div className="space-y-4">
          {questions.map((q, i) => {
            const r = result.results.find((x) => x.questionIndex === i);
            if (!r) return null;
            return (
              <div key={q.id || i} className="bg-white rounded-2xl border border-ink-300/40 p-5">
                <p className="text-sm font-medium text-ink-900 mb-3">
                  Q{i + 1}. {q.text}
                </p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => {
                    const isSelected = r.selectedIndex === oi;
                    const isCorrectOption = r.correctIndex === oi;
                    let cls = 'flex items-center gap-3 px-3 py-2 rounded-xl text-sm border ';
                    if (isCorrectOption) cls += 'bg-green-50 border-green-200 text-green-800';
                    else if (isSelected && !isCorrectOption) cls += 'bg-red-50 border-red-200 text-red-700';
                    else cls += 'border-ink-300/40 text-ink-600';
                    return (
                      <div key={oi} className={cls}>
                        <span className="flex-1">{opt}</span>
                        {isCorrectOption && (
                          <span className="text-xs font-semibold flex-shrink-0">Correct</span>
                        )}
                        {isSelected && !isCorrectOption && (
                          <span className="text-xs font-semibold flex-shrink-0">Your answer</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <QuizLeaderboard date={result.date} />
    </div>
  );
}
