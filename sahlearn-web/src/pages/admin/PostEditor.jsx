import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminGetPost, createPost, updatePost } from '../../services/posts.service';
import BlogEditor from '../../components/admin/BlogEditor';
import ImageUploader from '../../components/admin/ImageUploader';
import Button from '../../components/common/Button';

const CATEGORIES = ['General', 'Tutorial', 'News', 'Tips', 'Design', 'AI', 'Marketing', 'Office'];

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '',
  category: 'General', tags: [], author: '',
  status: 'draft', isFeatured: false,
  coverImage: null, seoTitle: '', seoDescription: '',
};

export default function PostEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    adminGetPost(id)
      .then((post) => setForm({ ...EMPTY, ...post }))
      .catch(() => toast.error('Failed to load post.'))
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || form.tags.includes(tag) || form.tags.length >= 10) return;
    set('tags', [...form.tags, tag]);
    setTagInput('');
  };

  const removeTag = (t) => set('tags', form.tags.filter((x) => x !== t));

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
  };

  const handleSubmit = async (e, saveAs) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, status: saveAs };
      if (isEdit) {
        await updatePost(id, payload);
        toast.success('Post saved.');
      } else {
        await createPost(payload);
        toast.success(saveAs === 'published' ? 'Post published.' : 'Draft saved.');
      }
      navigate('/admin/posts');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        data.errors.forEach((e) => toast.error(`${e.field}: ${e.message}`));
      } else {
        toast.error(data?.message || 'Failed to save post.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-ink-900 mb-8">{isEdit ? 'Edit Post' : 'New Post'}</h1>

      <form onSubmit={(e) => handleSubmit(e, 'draft')}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-5">
            <Field label="Title" required>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className={inputCls}
                placeholder="How to Master CorelDRAW"
                required
              />
            </Field>

            <Field label="Slug">
              <input
                value={form.slug}
                onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className={inputCls}
                placeholder="auto-generated if blank"
              />
            </Field>

            <Field label="Excerpt" required>
              <textarea
                value={form.excerpt}
                onChange={(e) => set('excerpt', e.target.value)}
                className={`${inputCls} resize-none`}
                rows={2}
                maxLength={300}
                required
              />
              <p className="text-xs text-ink-500 mt-1">{form.excerpt.length}/300</p>
            </Field>

            <Field label="Content" required>
              <BlogEditor value={form.content} onChange={(v) => set('content', v)} />
            </Field>

            {/* Tags */}
            <Field label="Tags">
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className={`${inputCls} flex-1`}
                  placeholder="Type tag, press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 border border-ink-300 rounded-lg text-ink-700 hover:bg-surface-100 text-sm"
                >
                  <Plus size={16} />
                </button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.tags.map((t) => (
                    <span key={t} className="flex items-center gap-1 bg-surface-100 text-ink-700 text-xs px-2.5 py-1 rounded-full">
                      {t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:text-brand-danger">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-ink-500 mt-1">{form.tags.length}/10 tags</p>
            </Field>

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
                  folder="blog"
                />
              </Field>

              <Field label="Category">
                <select value={form.category} onChange={(e) => set('category', e.target.value)} className={inputCls}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Author">
                <input value={form.author} onChange={(e) => set('author', e.target.value)} className={inputCls} placeholder="Sahlearn" />
              </Field>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-ink-700">Featured</label>
                <Toggle checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                loading={loading}
                className="w-full"
                onClick={(e) => handleSubmit(e, 'published')}
              >
                {isEdit && form.status === 'published' ? 'Update' : 'Publish'}
              </Button>
              <Button
                type="submit"
                variant="secondary"
                loading={loading}
                className="w-full"
              >
                Save Draft
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/admin/posts')}>
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
