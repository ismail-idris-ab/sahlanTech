const ESSAY_MAX_LENGTH = 2000;

export default function QuizQuestion({ question, index, total, selectedIndex, answerText, onSelect, onType }) {
  const isEssay = question.type === 'essay';

  if (isEssay) {
    const value = answerText || '';
    return (
      <div>
        <p className="text-sm font-medium text-ink-400 mb-2">
          Question {index + 1} of {total}
        </p>
        <h2 className="text-lg font-semibold text-ink-900 mb-2">{question.text}</h2>
        <p className="text-xs text-ink-400 mb-4">
          Written answer · worth {question.points} point{question.points === 1 ? '' : 's'} · marked by your
          teacher after you submit
        </p>
        <textarea
          value={value}
          onChange={(e) => onType(e.target.value.slice(0, ESSAY_MAX_LENGTH))}
          rows={8}
          maxLength={ESSAY_MAX_LENGTH}
          aria-label={`Your answer to question ${index + 1}`}
          placeholder="Type your answer here..."
          className="w-full px-4 py-3 border border-ink-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-y"
        />
        <p className="text-xs text-ink-400 mt-1 text-right">
          {value.length} / {ESSAY_MAX_LENGTH}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-ink-400 mb-2">
        Question {index + 1} of {total}
      </p>
      <h2 className="text-lg font-semibold text-ink-900 mb-4">{question.text}</h2>
      <div role="radiogroup" aria-label={`Question ${index + 1} options`} className="space-y-3">
        {question.options.map((opt, oi) => {
          const checked = selectedIndex === oi;
          return (
            <label
              key={oi}
              className={`block w-full cursor-pointer rounded-xl border px-4 py-3 text-sm transition-colors ${
                checked
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary font-medium'
                  : 'border-ink-300 text-ink-700 hover:bg-surface-100'
              }`}
            >
              <input
                type="radio"
                name={`quiz-question-${index}`}
                value={oi}
                checked={checked}
                onChange={() => onSelect(oi)}
                className="sr-only"
              />
              {opt}
            </label>
          );
        })}
      </div>
    </div>
  );
}
