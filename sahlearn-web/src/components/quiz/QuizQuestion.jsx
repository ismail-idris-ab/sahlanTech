export default function QuizQuestion({ question, index, total, selectedIndex, onSelect }) {
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
