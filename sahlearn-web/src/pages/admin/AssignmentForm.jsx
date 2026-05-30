import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createAssignment, getAssignment, updateAssignment } from '../../services/adminAssignments.service';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AssignmentForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    course: '',
    title: '',
    description: '',
    dueDate: '',
    isPublished: true,
    totalPoints: 100,
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/admin/courses?limit=100').then(({ data }) => setCourses(data.data || [])).catch(() => {});

    if (isEdit) {
      getAssignment(id)
        .then((a) => {
          setForm({
            course: a.course?.id || a.course?._id || a.course || '',
            title: a.title,
            description: a.description || '',
            dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : '',
            isPublished: a.isPublished,
            totalPoints: a.totalPoints || 100,
          });
        })
        .catch(() => toast.error('Failed to load assignment'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.course) { toast.error('Please select a course'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        dueDate: form.dueDate || undefined,
        description: form.description || undefined,
      };
      if (isEdit) {
        await updateAssignment(id, payload);
        toast.success('Assignment updated');
      } else {
        const created = await createAssignment(payload);
        toast.success('Assignment created');
        navigate(`/admin/assignments/${created._id}`);
        return;
      }
      navigate('/admin/assignments');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-display text-ink-900">{isEdit ? 'Edit Assignment' : 'New Assignment'}</h1>

      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Course <span className="text-red-500">*</span></label>
            <select
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              required
              className="w-full px-3 py-2.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Week 3 Assignment"
              className="w-full px-3 py-2.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Total Points <span className="text-red-500">*</span></label>
            <input
              type="number"
              required
              min={1}
              max={1000}
              value={form.totalPoints}
              onChange={(e) => setForm({ ...form, totalPoints: Number(e.target.value) || 100 })}
              className="w-full px-3 py-2.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Description <span className="text-ink-400">(optional)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={3000}
              rows={5}
              placeholder="Describe what students should do..."
              className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Due Date <span className="text-ink-400">(optional)</span></label>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full px-3 py-2.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublished"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="w-4 h-4 rounded accent-brand-primary"
            />
            <label htmlFor="isPublished" className="text-sm text-ink-700">Published (visible to students)</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Assignment'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/assignments')}
              className="px-5 py-2.5 border border-surface-300 text-ink-600 text-sm font-medium rounded-xl hover:bg-surface-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
