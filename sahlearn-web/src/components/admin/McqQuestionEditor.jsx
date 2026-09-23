import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

export const emptyMcqQuestion = () => ({
  text: '',
  options: ['', '', '', ''],
  correctIndex: null,
  points: 1,
});

export default function McqQuestionEditor({ question, index, onChange, onRemove }) {
  const [open, setOpen] = useState(true);

  const update = (field, value) => onChange({ ...question, [field]: value });
  const updateOption = (oi, value) => {
    const opts = [...question.options];
    opts[oi] = value;
    onChange({ ...question, options: opts });
  };
  const addOption = () => {
    if (question.options.length >= 4) return;
    onChange({ ...question, options: [...question.options, ''] });
  };
  const removeOption = (oi) => {
    if (question.options.length <= 2) return;
    const opts = question.options.filter((_, i) => i !== oi);
    let ci = question.correctIndex;
    if (ci == null) ci = null;
    else if (ci === oi) ci = null;   // the correct option itself was deleted
    else if (ci > oi) ci -= 1;       // shift down
    onChange({ ...question, options: opts, correctIndex: ci });
  };

  return (
    <div className="border border-surface-200 rounded-2xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-surface-50 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <GripVertical size={14} className="text-ink-300 flex-shrink-0" />
        <span className="text-sm font-medium text-ink-700 flex-1 truncate">
          Q{index + 1}: {question.text || <span className="text-ink-300 italic">Untitled question</span>}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 rounded-lg hover:bg-red-50 text-ink-300 hover:text-red-500 transition flex-shrink-0"
        >
          <Trash2 size={13} />
        </button>
        {open ? <ChevronUp size={14} className="text-ink-400" /> : <ChevronDown size={14} className="text-ink-400" />}
      </div>

      {open && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Question Text</label>
            <textarea
              value={question.text}
              onChange={(e) => update('text', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
              placeholder="Enter question text..."
            />
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Points</label>
              <input
                type="number"
                min={1}
                value={question.points}
                onChange={(e) => update('points', parseInt(e.target.value) || 1)}
                className="w-20 px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-ink-600">Options</label>
              <span className="text-xs text-ink-400">Click the radio button to mark the correct answer</span>
            </div>
            <div className="space-y-2">
              {question.correctIndex === null && (
                <p className="text-xs text-amber-600 mb-2">No correct answer selected — click a radio button to mark one.</p>
              )}
              {question.options.map((opt, oi) => {
                const isCorrect = question.correctIndex === oi;
                const letter = ['A', 'B', 'C', 'D'][oi];
                return (
                  <label
                    key={oi}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition ${
                      isCorrect
                        ? 'bg-green-50 border-green-300'
                        : 'border-surface-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={isCorrect}
                      onChange={() => update('correctIndex', oi)}
                      className="accent-green-600 flex-shrink-0"
                    />
                    <span className={`text-xs font-bold w-4 flex-shrink-0 ${isCorrect ? 'text-green-700' : 'text-ink-400'}`}>
                      {letter}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(oi, e.target.value)}
                      placeholder={`Option ${letter}`}
                      className="flex-1 bg-transparent text-sm focus:outline-none text-ink-900 placeholder:text-ink-300"
                    />
                    {isCorrect && (
                      <span className="text-xs font-semibold text-green-600 flex-shrink-0">Correct</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); removeOption(oi); }}
                      disabled={question.options.length <= 2}
                      className="p-1 rounded hover:bg-red-50 text-ink-300 hover:text-red-500 transition flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-ink-300"
                    >
                      <Trash2 size={12} />
                    </button>
                  </label>
                );
              })}
              {question.options.length < 4 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-brand-primary hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add option
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
