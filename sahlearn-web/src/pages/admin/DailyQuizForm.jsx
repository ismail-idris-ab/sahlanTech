import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createDailyQuiz, getDailyQuiz, updateDailyQuiz } from '../../services/adminDailyQuizzes.service';
import McqQuestionEditor, { emptyMcqQuestion } from '../../components/admin/McqQuestionEditor';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 10;

// Mirrors sahlearn-api/src/utils/dateKey.js — the backend keys daily quizzes
// on Africa/Lagos, not the admin's browser timezone.
const LAGOS_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const todayDateKey = () => LAGOS_FORMATTER.format(new Date());

export default function DailyQuizForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    date: todayDateKey(),
    title: '',
    description: '',
    isPublished: false,
  });
  const [questions, setQuestions] = useState(
    Array.from({ length: MIN_QUESTIONS }, emptyMcqQuestion)
  );
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  // Pristine copy of the questions as loaded from the server, used to detect
  // whether the admin actually changed them before including `questions` in
  // a PATCH — the backend rejects any PATCH containing `questions` once a
  // student has submitted an attempt, even when the array is unchanged.
  const [loadedQuestions, setLoadedQuestions] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    getDailyQuiz(id)
      .then((quiz) => {
        setForm({
          date: quiz.date || todayDateKey(),
          title: quiz.title || '',
          description: quiz.description || '',
          isPublished: quiz.isPublished ?? false,
        });
        const loaded = quiz.questions?.length ? quiz.questions : Array.from({ length: MIN_QUESTIONS }, emptyMcqQuestion);
        setQuestions(loaded);
        setLoadedQuestions(loaded);
      })
      .catch(() => toast.error('Failed to load quiz'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const addQuestion = () => {
    if (questions.length >= MAX_QUESTIONS) return;
    setQuestions((prev) => [...prev, emptyMcqQuestion()]);
  };
  const updateQuestion = (i, q) => setQuestions((prev) => prev.map((item, idx) => (idx === i ? q : item)));
  const removeQuestion = (i) => {
    if (questions.length <= MIN_QUESTIONS) return;
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  };

  const validate = () => {
    if (questions.length < MIN_QUESTIONS) {
      toast.error(`Add at least ${MIN_QUESTIONS} question${MIN_QUESTIONS === 1 ? '' : 's'}`);
      return false;
    }
    if (questions.length > MAX_QUESTIONS) {
      toast.error(`No more than ${MAX_QUESTIONS} questions allowed`);
      return false;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        toast.error(`Q${i + 1}: enter the question text`);
        return false;
      }
      if (q.options.some((opt) => !opt.trim())) {
        toast.error(`Q${i + 1}: fill in every option`);
        return false;
      }
      if (q.correctIndex === null || q.correctIndex === undefined) {
        toast.error(`Mark the correct answer for Q${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!validate()) return;

    const normalizeQuestions = (qs) =>
      qs.map((q) => ({
        text: q.text.trim(),
        options: q.options.map((opt) => opt.trim()),
        correctIndex: q.correctIndex,
        points: q.points || 1,
      }));

    const normalizedQuestions = normalizeQuestions(questions);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      isPublished: form.isPublished,
    };

    // On create, questions are always sent. On edit, only send them when they
    // actually changed from what was loaded — otherwise a title/description/
    // isPublished-only edit gets rejected with 409 once a student has already
    // submitted an attempt for this quiz.
    if (!isEdit) {
      payload.questions = normalizedQuestions;
      payload.date = form.date;
    } else if (
      JSON.stringify(normalizedQuestions) !== JSON.stringify(normalizeQuestions(loadedQuestions || []))
    ) {
      payload.questions = normalizedQuestions;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateDailyQuiz(id, payload);
        toast.success('Quiz updated');
      } else {
        await createDailyQuiz(payload);
        toast.success('Quiz created');
      }
      navigate('/admin/daily-quizzes');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      const errors = err.response?.data?.errors;
      if (status === 409) {
        // Students have already taken this quiz — questions can no longer be changed.
        toast.error(message || 'This quiz can no longer be changed.');
      } else if (status === 422 && errors?.length) {
        errors.forEach((fieldErr) => toast.error(fieldErr.message));
      } else {
        toast.error(message || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-display text-ink-900">{isEdit ? 'Edit Daily Quiz' : 'New Daily Quiz'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Date</label>
              <input
                type="date"
                required
                disabled={isEdit}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary disabled:bg-surface-100 disabled:text-ink-400"
              />
              {isEdit && (
                <p className="text-[10px] text-ink-400 mt-1">The date cannot be changed after a quiz is created.</p>
              )}
            </div>
            <div className="flex items-center gap-2 sm:mt-6">
              <input
                type="checkbox"
                id="isPublished"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="accent-brand-primary"
              />
              <label htmlFor="isPublished" className="text-sm text-ink-700">Published (visible to students)</label>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-ink-600 mb-1">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                placeholder="Quiz title"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-ink-600 mb-1">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
                placeholder="Instructions or context for students..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">
              Questions <span className="text-ink-400 font-normal text-sm">({questions.length} / {MAX_QUESTIONS})</span>
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              disabled={questions.length >= MAX_QUESTIONS}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface-100 text-ink-700 rounded-xl hover:bg-surface-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={13} /> Add Question
            </button>
          </div>

          <div className="space-y-3">
            {questions.map((q, i) => (
              <McqQuestionEditor
                key={i}
                question={q}
                index={i}
                onChange={(updated) => updateQuestion(i, updated)}
                onRemove={() => removeQuestion(i)}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Quiz'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/daily-quizzes')}
            className="px-6 py-2.5 border border-surface-300 text-ink-700 font-medium rounded-xl hover:bg-surface-100 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
