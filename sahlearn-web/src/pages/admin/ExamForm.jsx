import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { createExam, getExam, updateExam } from '../../services/adminExams.service';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyQuestion = () => ({
  text: '',
  type: 'mcq',
  options: ['', '', '', ''],
  correctIndex: 0,
  points: 1,
});

function QuestionEditor({ question, index, onChange, onRemove }) {
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
    onChange({ ...question, options: opts, correctIndex: Math.min(question.correctIndex, opts.length - 1) });
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
        <span className="text-xs text-ink-400">{question.type.toUpperCase()}</span>
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
              <label className="block text-xs font-medium text-ink-600 mb-1">Type</label>
              <select
                value={question.type}
                onChange={(e) => update('type', e.target.value)}
                className="px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              >
                <option value="mcq">Multiple Choice</option>
                <option value="short">Short Answer</option>
              </select>
            </div>
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

          {question.type === 'mcq' && (
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-2">Options (select correct answer)</label>
              <div className="space-y-2">
                {question.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${index}`}
                      checked={question.correctIndex === oi}
                      onChange={() => update('correctIndex', oi)}
                      className="accent-brand-primary flex-shrink-0"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 px-3 py-1.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                    />
                    {question.options.length > 2 && (
                      <button
                        onClick={() => removeOption(oi)}
                        className="p-1 rounded hover:bg-red-50 text-ink-300 hover:text-red-500 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
                {question.options.length < 4 && (
                  <button
                    onClick={addOption}
                    className="text-xs text-brand-primary hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Add option
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExamForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    course: '',
    duration: '',
    dueDate: '',
    isPublished: true,
  });
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/admin/courses?limit=100').then(({ data }) => setCourses(data.data || []));
    if (isEdit) {
      getExam(id).then((exam) => {
        setForm({
          title: exam.title || '',
          description: exam.description || '',
          course: exam.course?._id || exam.course || '',
          duration: exam.duration || '',
          dueDate: exam.dueDate ? new Date(exam.dueDate).toISOString().slice(0, 16) : '',
          isPublished: exam.isPublished ?? true,
        });
        setQuestions(exam.questions?.length ? exam.questions : [emptyQuestion()]);
      });
    }
  }, [id, isEdit]);

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const updateQuestion = (i, q) => setQuestions((prev) => prev.map((item, idx) => idx === i ? q : item));
  const removeQuestion = (i) => setQuestions((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.course) { toast.error('Select a course'); return; }
    if (questions.length === 0) { toast.error('Add at least one question'); return; }

    const payload = {
      ...form,
      duration: form.duration ? Number(form.duration) : undefined,
      dueDate: form.dueDate || undefined,
      questions: questions.map((q) => {
        const clean = { text: q.text, type: q.type, points: q.points || 1 };
        if (q.type === 'mcq') {
          clean.options = q.options.filter(Boolean);
          clean.correctIndex = q.correctIndex;
        }
        return clean;
      }),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateExam(id, payload);
        toast.success('Exam updated');
        navigate(`/admin/exams/${id}`);
      } else {
        const created = await createExam(payload);
        toast.success('Exam created');
        navigate(`/admin/exams/${created.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-display text-ink-900">{isEdit ? 'Edit Exam' : 'New Exam'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
          <h2 className="font-semibold text-ink-900">Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-ink-600 mb-1">Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                placeholder="Exam title"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Course</label>
              <select
                required
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              >
                <option value="">Select course...</option>
                {courses.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Duration (minutes, optional)</label>
              <input
                type="number"
                min={1}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
                placeholder="e.g. 60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Due Date (optional)</label>
              <input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
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
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="accent-brand-primary"
              />
              <label htmlFor="isPublished" className="text-sm text-ink-700">Published (visible to students)</label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">
              Questions <span className="text-ink-400 font-normal text-sm">({questions.length})</span>
            </h2>
            <button
              type="button"
              onClick={addQuestion}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface-100 text-ink-700 rounded-xl hover:bg-surface-200 transition"
            >
              <Plus size={13} /> Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <p className="text-sm text-ink-400 text-center py-6">No questions yet. Add one above.</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q, i) => (
                <QuestionEditor
                  key={i}
                  question={q}
                  index={i}
                  onChange={(updated) => updateQuestion(i, updated)}
                  onRemove={() => removeQuestion(i)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Exam'}
          </button>
          <button
            type="button"
            onClick={() => navigate(isEdit ? `/admin/exams/${id}` : '/admin/exams')}
            className="px-6 py-2.5 border border-surface-300 text-ink-700 font-medium rounded-xl hover:bg-surface-100 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
