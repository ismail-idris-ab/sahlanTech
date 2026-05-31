import { useEffect, useState } from 'react';
import { getContent, updateContent } from '../../services/siteContent.service';
import { Plus, Trash2, ChevronUp, ChevronDown, Quote } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_ABOUT = {
  heroTitle: 'About Sahlearn',
  heroSubtitle: 'Our mission, our teacher, and what we teach.',
  instructorLabel: 'Our Instructor',
  instructorHeading: 'Meet your teacher',
  bio: 'Sahlearn was founded with a simple belief: every Nigerian deserves access to practical, affordable digital skills training. Our instructor brings years of hands-on experience to every lesson.\n\nWe don\'t just teach theory. Every course is built around real-world projects you can use immediately — whether you\'re starting a business, upgrading your career, or building freelance income.\n\nOur students come from diverse backgrounds — students, entrepreneurs, civil servants, traders — and we meet each one exactly where they are.',
  credentials: [
    { label: 'Certified Instructor', desc: 'Professionally trained in digital skills education' },
    { label: 'Hundreds of Students', desc: 'Learners trained across Nigeria' },
    { label: 'Multi-subject', desc: 'Design, Office, AI, Marketing and more' },
    { label: 'WhatsApp-first', desc: 'Always reachable and responsive' },
  ],
  whyTrustHeading: 'Why trust Sahlearn?',
  ctaHeading: 'Have questions?',
  ctaSubtext: 'Reach out and we\'ll respond within 24 hours.',
};

// ─── Reusable list item wrapper ───────────────────────────────────────────────

function ListItemCard({ index, total, onMoveUp, onMoveDown, onRemove, children, label }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-500">{label} #{index + 1}</span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onMoveUp} disabled={index === 0}
            className="p-1.5 rounded-lg hover:bg-surface-100 text-ink-400 disabled:opacity-30 transition">
            <ChevronUp size={14} />
          </button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1}
            className="p-1.5 rounded-lg hover:bg-surface-100 text-ink-400 disabled:opacity-30 transition">
            <ChevronDown size={14} />
          </button>
          <button type="button" onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-500 transition">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

function AddButton({ onClick, label }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 border border-dashed border-surface-400 rounded-xl text-sm text-ink-500 hover:border-brand-primary hover:text-brand-primary transition w-full justify-center">
      <Plus size={14} /> {label}
    </button>
  );
}

function SaveButton({ saving, label }) {
  return (
    <div className="flex justify-end pt-2">
      <button type="submit" disabled={saving}
        className="px-6 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60">
        {saving ? 'Saving...' : label}
      </button>
    </div>
  );
}

// ─── About editor ─────────────────────────────────────────────────────────────

function AboutEditor({ initial, onSave, saving }) {
  const [form, setForm] = useState({ ...DEFAULT_ABOUT, ...initial });

  useEffect(() => { setForm({ ...DEFAULT_ABOUT, ...initial }); }, [initial]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const updateCredential = (i, field, value) => {
    const next = form.credentials.map((c, idx) => (idx === i ? { ...c, [field]: value } : c));
    set('credentials', next);
  };

  const textField = (label, key, multiline = false, hint = '') => (
    <div>
      <label className="block text-xs font-medium text-ink-600 mb-1">{label}</label>
      {multiline ? (
        <textarea value={form[key] || ''} onChange={(e) => set(key, e.target.value)} rows={6}
          className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none" />
      ) : (
        <input type="text" value={form[key] || ''} onChange={(e) => set(key, e.target.value)}
          className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary" />
      )}
      {hint && <p className="text-[10px] text-ink-400 mt-1">{hint}</p>}
    </div>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-6">
      <div className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
        <h2 className="font-semibold text-ink-900">Hero Section</h2>
        {textField('Page Title', 'heroTitle')}
        {textField('Subtitle', 'heroSubtitle')}
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
        <h2 className="font-semibold text-ink-900">Instructor Bio</h2>
        {textField('Instructor Label (chip text)', 'instructorLabel')}
        {textField('Section Heading', 'instructorHeading')}
        {textField('Bio', 'bio', true, 'Separate paragraphs with a blank line.')}
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
        <h2 className="font-semibold text-ink-900">Trust Cards</h2>
        {textField('Section Heading', 'whyTrustHeading')}
        <div className="space-y-3">
          {(form.credentials || []).map((c, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 p-3 bg-surface-50 rounded-xl border border-surface-200">
              <div>
                <label className="block text-[10px] font-medium text-ink-500 mb-0.5">Label</label>
                <input type="text" value={c.label} onChange={(e) => updateCredential(i, 'label', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-ink-500 mb-0.5">Description</label>
                <input type="text" value={c.desc} onChange={(e) => updateCredential(i, 'desc', e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 p-6 space-y-4">
        <h2 className="font-semibold text-ink-900">CTA Banner</h2>
        {textField('Heading', 'ctaHeading')}
        {textField('Sub-text', 'ctaSubtext')}
      </div>

      <SaveButton saving={saving} label="Save About Page" />
    </form>
  );
}

// ─── FAQ editor ───────────────────────────────────────────────────────────────

function FaqEditor({ initial, onSave, saving }) {
  const [items, setItems] = useState(initial || []);

  useEffect(() => { setItems(initial || []); }, [initial]);

  const add = () => setItems((prev) => [...prev, { question: '', answer: '' }]);
  const update = (i, field, value) => setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  const remove = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const next = [...items];
    const swap = i + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[i], next[swap]] = [next[swap], next[i]];
    setItems(next);
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(items); }} className="space-y-4">
      {items.length === 0 && (
        <div className="text-center py-12 text-ink-400 text-sm bg-white rounded-2xl border border-surface-200">
          No FAQ items yet. Add one below.
        </div>
      )}
      {items.map((item, i) => (
        <ListItemCard key={i} index={i} total={items.length} label="FAQ"
          onMoveUp={() => move(i, -1)} onMoveDown={() => move(i, 1)} onRemove={() => remove(i)}>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Question</label>
            <input type="text" value={item.question} onChange={(e) => update(i, 'question', e.target.value)}
              placeholder="e.g. How long is the course?"
              className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Answer</label>
            <textarea value={item.answer} onChange={(e) => update(i, 'answer', e.target.value)} rows={3}
              placeholder="Write the answer here..."
              className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none" />
          </div>
        </ListItemCard>
      ))}
      <AddButton onClick={add} label="Add FAQ item" />
      <SaveButton saving={saving} label="Save FAQ" />
    </form>
  );
}

// ─── Testimonials editor ──────────────────────────────────────────────────────

function TestimonialsEditor({ initial, onSave, saving }) {
  const [items, setItems] = useState(initial || []);

  useEffect(() => { setItems(initial || []); }, [initial]);

  const add = () => setItems((prev) => [...prev, { name: '', role: '', text: '', avatarUrl: '' }]);
  const update = (i, field, value) => setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  const remove = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const next = [...items];
    const swap = i + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[i], next[swap]] = [next[swap], next[i]];
    setItems(next);
  };

  const inputCls = 'w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary';

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(items); }} className="space-y-4">
      <p className="text-xs text-ink-500 bg-surface-50 border border-surface-200 rounded-xl px-4 py-3">
        First 3 testimonials show on the Home page. All show on the About page. Drag order controls display order.
      </p>

      {items.length === 0 && (
        <div className="text-center py-12 text-ink-400 text-sm bg-white rounded-2xl border border-surface-200">
          No testimonials yet. Add one below.
        </div>
      )}

      {items.map((item, i) => (
        <ListItemCard key={i} index={i} total={items.length} label="Testimonial"
          onMoveUp={() => move(i, -1)} onMoveDown={() => move(i, 1)} onRemove={() => remove(i)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Name <span className="text-red-500">*</span></label>
              <input type="text" value={item.name} onChange={(e) => update(i, 'name', e.target.value)}
                placeholder="e.g. Amaka O." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Role / Course</label>
              <input type="text" value={item.role} onChange={(e) => update(i, 'role', e.target.value)}
                placeholder="e.g. Graphic Design student" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Testimonial Text <span className="text-red-500">*</span></label>
            <textarea value={item.text} onChange={(e) => update(i, 'text', e.target.value)} rows={3}
              placeholder="What did they say about Sahlearn?"
              className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Avatar URL <span className="text-ink-400">(optional)</span></label>
            <input type="url" value={item.avatarUrl} onChange={(e) => update(i, 'avatarUrl', e.target.value)}
              placeholder="https://..." className={inputCls} />
            <p className="text-[10px] text-ink-400 mt-1">Leave blank to show initials avatar.</p>
          </div>
        </ListItemCard>
      ))}

      <AddButton onClick={add} label="Add testimonial" />
      <SaveButton saving={saving} label="Save Testimonials" />
    </form>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'about', label: 'About Page' },
  { key: 'faq', label: 'FAQ' },
  { key: 'testimonials', label: 'Testimonials' },
];

export default function SiteContent() {
  const [tab, setTab] = useState('about');
  const [aboutData, setAboutData] = useState(null);
  const [faqData, setFaqData] = useState(null);
  const [testimonialsData, setTestimonialsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getContent('about'), getContent('faq'), getContent('testimonials')])
      .then(([about, faq, testimonials]) => {
        setAboutData(about || {});
        setFaqData(Array.isArray(faq) ? faq : []);
        setTestimonialsData(Array.isArray(testimonials) ? testimonials : []);
      })
      .catch(() => {
        setAboutData({});
        setFaqData([]);
        setTestimonialsData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async (key, data, setter) => {
    setSaving(true);
    try {
      const saved = await updateContent(key, data);
      setter(Array.isArray(saved) ? saved : (saved || {}));
      toast.success('Saved');
    } catch {
      toast.error('Failed to save');
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
      <div>
        <h1 className="text-2xl font-display text-ink-900">Site Content</h1>
        <p className="text-sm text-ink-500 mt-1">Edit the public About page, FAQ, and Testimonials.</p>
      </div>

      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl w-fit">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'about' && (
        <AboutEditor initial={aboutData} onSave={(d) => save('about', d, setAboutData)} saving={saving} />
      )}
      {tab === 'faq' && (
        <FaqEditor initial={faqData} onSave={(d) => save('faq', d, setFaqData)} saving={saving} />
      )}
      {tab === 'testimonials' && (
        <TestimonialsEditor initial={testimonialsData} onSave={(d) => save('testimonials', d, setTestimonialsData)} saving={saving} />
      )}
    </div>
  );
}
