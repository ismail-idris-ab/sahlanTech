import { Link } from 'react-router-dom';
import { formatDuration } from '../../services/dailyQuiz.service';
import QuizLeaderboard from './QuizLeaderboard';

export default function QuizResult({ result, questions }) {
  const hasReview = Array.isArray(result?.results) && Array.isArray(questions) && questions.length > 0;
  const pending = result?.pendingEssays || 0;

  return (
    <div className="space-y-8">
      <div className="text-center bg-white rounded-2xl border border-ink-300/40 p-8">
        <p className="text-4xl font-bold text-brand-primary">
          {result.score} <span className="text-xl font-normal text-ink-400">/ {result.maxScore}</span>
        </p>
        {pending > 0 && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mt-3 inline-block">
            {pending} written answer{pending === 1 ? '' : 's'} still to be marked — your score will go up once
            your teacher has read {pending === 1 ? 'it' : 'them'}.
          </p>
        )}
        <p className="text-sm text-ink-500 mt-2">Time: {formatDuration(result.durationMs)}</p>

        {result.alreadySubmitted && (
          <p className="text-sm text-ink-500 mt-3">You took today's quiz already.</p>
        )}

        <Link to="/student/login" className="inline-block mt-4 text-brand-primary hover:underline text-sm">
          Sahlearn student? Log in to see your full quiz history.
        </Link>
      </div>

      {hasReview && (
        <div className="space-y-4">
          {questions.map((q, i) => {
            const r = result.results.find((x) => x.questionIndex === i);
            if (!r) return null;

            if (r.type === 'essay') {
              return (
                <div key={q.id || i} className="bg-white rounded-2xl border border-ink-300/40 p-5">
                  <p className="text-sm font-medium text-ink-900 mb-3">
                    Q{i + 1}. {q.text}
                  </p>
                  <p className="text-xs font-medium text-ink-400 mb-1">Your answer</p>
                  <p className="text-sm text-ink-700 whitespace-pre-wrap bg-surface-50 border border-ink-300/40 rounded-xl px-4 py-3">
                    {r.text || <span className="text-ink-400 italic">You left this one blank.</span>}
                  </p>
                  <p className="text-xs text-amber-700 mt-2">
                    {r.graded
                      ? `Marked: ${r.awardedPoints} / ${r.points}`
                      : `Awaiting marking · worth ${r.points} point${r.points === 1 ? '' : 's'}`}
                  </p>
                </div>
              );
            }

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
