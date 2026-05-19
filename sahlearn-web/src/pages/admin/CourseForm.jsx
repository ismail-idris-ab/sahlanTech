import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminGetCourse, createCourse, updateCourse } from '../../services/courses.service';
import ImageUploader from '../../components/admin/ImageUploader';
import Button from '../../components/common/Button';

const CATEGORIES = ['Design', 'Office', 'AI', 'Marketing', 'General'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const EMPTY = {
  title: '', slug: '', shortDescription: '', description: '',
  category: 'Design', level: 'Beginner', duration: '', price: '',
  whatYouLearn: [''], prerequisites: [],
  isPublished: false, isFeatured: false,
  videoUrl: '',
  seoTitle: '', seoDescription: '',
  coverImage: null,
};

export default function CourseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    adminGetCourse(id)
      .then((course) => setForm({ ...EMPTY, ...course, whatYouLearn: course.whatYouLearn?.length ? course.whatYouLearn : [''] }))
      .catch(() => toast.error('Failed to load course.'))
      .finally(() => setFetching(false));
  }, [id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        whatYouLearn: form.whatYouLearn.filter(Boolean),
        prerequisites: form.prerequisites.filter(Boolean),
      };
      if (isEdit) {
        await updateCourse(id, payload);
        toast.success('Course updated.');
      } else {
        await createCourse(payload);
        toast.success('Course created.');
      }
      navigate('/admin/courses');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        data.errors.forEach((e) => toast.error(`${e.field}: ${e.message}`));
      } else {
        toast.error(data?.message || 'Failed to save course.');
      }
    } finally {
      setLoading(false);
    }
  };

  const addBullet = (key) => set(key, [...form[key], '']);
  const removeBullet = (key, i) => set(key, form[key].filter((_, idx) => idx !== i));
  const updateBullet = (key, i, val) => set(key, form[key].map((v, idx) => idx === i ? val : v));

  if (fetching) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-ink-900 mb-8">{isEdit ? 'Edit Course' : 'New Course'}</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main fields */}
          <div className="lg:col-span-2 space-y-5">
            <Field label="Title" required>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className={inputCls}
                placeholder="CorelDRAW Fundamentals"
                required
              />
            </Field>

            <Field label="Slug">
              <input
                value={form.slug}
                onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className={inputCls}
                placeholder="auto-generated from title if blank"
              />
            </Field>

            <Field label="Short Description" required>
              <textarea
                value={form.shortDescription}
                onChange={(e) => set('shortDescription', e.target.value)}
                className={`${inputCls} resize-none`}
                rows={2}
                maxLength={300}
                required
              />
              <p className="text-xs text-ink-500 mt-1">{form.shortDescription.length}/300</p>
            </Field>

            <Field label="Full Description" required>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className={`${inputCls} resize-none`}
                rows={6}
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Category" required>
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Level" required>
                <select value={form.level} onChange={(e) => set('level', e.target.value)} className={inputCls}>
                  {LEVELS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Duration" required>
                <input value={form.duration} onChange={(e) => set('duration', e.target.value)} className={inputCls} placeholder="4 weeks" required />
              </Field>
              <Field label="Price" required>
                <input value={form.price} onChange={(e) => set('price', e.target.value)} className={inputCls} placeholder="₦25,000" required />
              </Field>
            </div>

            {/* What you'll learn */}
            <Field label="What You'll Learn">
              <div className="space-y-2">
                {form.whatYouLearn.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={item}
                      onChange={(e) => updateBullet('whatYouLearn', i, e.target.value)}
                      className={`${inputCls} flex-1`}
                      placeholder={`Bullet ${i + 1}`}
                    />
                    {form.whatYouLearn.length > 1 && (
                      <button type="button" onClick={() => removeBullet('whatYouLearn', i)} className="text-ink-500 hover:text-brand-danger">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addBullet('whatYouLearn')} className="text-brand-primary text-sm flex items-center gap-1 hover:underline">
                  <Plus size={14} /> Add bullet
                </button>
              </div>
            </Field>

            {/* Prerequisites */}
            <Field label="Prerequisites">
              <div className="space-y-2">
                {form.prerequisites.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={item}
                      onChange={(e) => updateBullet('prerequisites', i, e.target.value)}
                      className={`${inputCls} flex-1`}
                      placeholder={`Prerequisite ${i + 1}`}
                    />
                    <button type="button" onClick={() => removeBullet('prerequisites', i)} className="text-ink-500 hover:text-brand-danger">
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addBullet('prerequisites')} className="text-brand-primary text-sm flex items-center gap-1 hover:underline">
                  <Plus size={14} /> Add prerequisite
                </button>
              </div>
            </Field>

            {/* Preview video */}
            <div className="border-t border-ink-300/40 pt-5 space-y-4">
              <p className="text-sm font-semibold text-ink-700">Preview Video</p>
              <Field label="YouTube or Vimeo URL">
                <input
                  value={form.videoUrl}
                  onChange={(e) => set('videoUrl', e.target.value)}
                  className={inputCls}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-ink-500 mt-1">Paste a YouTube or Vimeo link. Shown on the course page.</p>
              </Field>
            </div>

            {/* SEO */}
            <div className="border-t border-ink-300/40 pt-5 space-y-4">
              <p className="text-sm font-semibold text-ink-700">SEO</p>
              <Field label="SEO Title">
                <input value={form.seoTitle} onChange={(e) => set('seoTitle', e.target.value)} className={inputCls} maxLength={70} />
                <p className="text-xs text-ink-500 mt-1">{form.seoTitle.length}/70</p>
              </Field>
              <Field label="SEO Description">
                <textarea value={form.seoDescription} onChange={(e) => set('seoDescription', e.target.value)} className={`${inputCls} resize-none`} rows={2} maxLength={160} />
                <p className="text-xs text-ink-500 mt-1">{form.seoDescription.length}/160</p>
              </Field>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-ink-300/40 p-5 space-y-5">
              <Field label="Cover Image">
                <ImageUploader
                  value={form.coverImage}
                  onChange={(val) => set('coverImage', val)}
                  folder="courses"
                />
              </Field>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ink-700">Published</label>
                <Toggle checked={form.isPublished} onChange={(v) => set('isPublished', v)} />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ink-700">Featured</label>
                <Toggle checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button type="submit" loading={loading} className="w-full">
                {isEdit ? 'Save Changes' : 'Create Course'}
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={() => navigate('/admin/courses')}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1">
        {label}{required && <span className="text-brand-danger ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-brand-primary' : 'bg-ink-300'}`}
    >
      <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

const inputCls = 'w-full border border-ink-300 rounded-lg px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary';
