// sahlearn-web/src/pages/admin/Announcements.jsx
import { useEffect, useRef, useState } from 'react';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../services/adminAnnouncements.service';
import api from '../../services/api';
import { Plus, Trash2, Paperclip, Users, BookOpen, User, Megaphone, FileText, Download, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TARGET_LABELS = {
  all: { label: 'All Students', icon: Users, cls: 'bg-brand-primary/10 text-brand-primary' },
  course: { label: 'Course', icon: BookOpen, cls: 'bg-blue-50 text-blue-700' },
  students: { label: 'Specific Students', icon: User, cls: 'bg-purple-50 text-purple-700' },
};

const fileIcon = (mimeType) => {
  if (!mimeType) return FileText;
  if (mimeType.includes('pdf')) return FileText;
  return Paperclip;
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', target: 'all', course: '', studentIds: [] });
  const [file, setFile] = useState(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const openEdit = (a) => {
    setEditingId(a.id);
    setForm({
      title: a.title,
      body: a.body,
      target: a.target,
      course: a.course?._id || a.course || '',
      studentIds: (a.studentIds || []).map(String),
    });
    setFile(null);
    setRemoveFile(false);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: '', body: '', target: 'all', course: '', studentIds: [] });
    setFile(null);
    setRemoveFile(false);
  };

  useEffect(() => {
    getAnnouncements()
      .then((d) => setAnnouncements(d.data || []))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
    api.get('/api/admin/courses?limit=100').then(({ data }) => setCourses(data.data || [])).catch(() => {});
    api.get('/api/admin/students?limit=200').then(({ data }) => setStudents(data.data || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and message required'); return; }
    if (form.target === 'course' && !form.course) { toast.error('Select a course'); return; }
    if (form.target === 'students' && form.studentIds.length === 0) { toast.error('Select at least one student'); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('body', form.body);
      fd.append('target', form.target);
      if (form.target === 'course') fd.append('course', form.course);
      if (form.target === 'students') fd.append('studentIds', JSON.stringify(form.studentIds));
      if (file) fd.append('file', file);
      if (removeFile) fd.append('removeFile', 'true');

      if (editingId) {
        const updated = await updateAnnouncement(editingId, fd);
        setAnnouncements((prev) => prev.map((a) => a.id === editingId ? { ...updated, id: updated.id || updated._id } : a));
        toast.success('Announcement updated');
      } else {
        const created = await createAnnouncement(fd);
        setAnnouncements((prev) => [created, ...prev]);
        toast.success('Announcement sent');
      }
      resetForm();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const toggleStudent = (id) => {
    setForm((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(id)
        ? prev.studentIds.filter((s) => s !== id)
        : [...prev.studentIds, id],
    }));
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Announcements</h1>
          <p className="text-xs text-ink-400 mt-0.5">{announcements.length} total</p>
        </div>
        <button
          onClick={() => { if (showForm && !editingId) { resetForm(); } else { resetForm(); setShowForm(true); } }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition"
        >
          {showForm && !editingId ? <X size={15} /> : <Plus size={15} />}
          {showForm && !editingId ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card p-6">
          <h2 className="font-semibold text-ink-900 mb-4">{editingId ? 'Edit Announcement' : 'New Announcement'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Title *</label>
              <input
                type="text" required maxLength={200}
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Class postponed — Friday"
                className="w-full px-3 py-2.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Message *</label>
              <textarea
                required maxLength={5000} rows={4}
                value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Write your message here..."
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
              />
            </div>

            {/* Target */}
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-2">Send to</label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(TARGET_LABELS).map(([key, { label }]) => (
                  <button
                    key={key} type="button"
                    onClick={() => setForm({ ...form, target: key, course: '', studentIds: [] })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${form.target === key ? 'bg-brand-primary text-white border-brand-primary' : 'border-surface-300 text-ink-600 hover:bg-surface-100'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {form.target === 'course' && (
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Course *</label>
                <select
                  value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })}
                  className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
                >
                  <option value="">Select course...</option>
                  {courses.map((c) => <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>)}
                </select>
              </div>
            )}

            {form.target === 'students' && (
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-2">Select students ({form.studentIds.length} selected)</label>
                <div className="max-h-44 overflow-y-auto border border-surface-200 rounded-xl divide-y divide-surface-100">
                  {students.map((s) => {
                    const sid = String(s.id || s._id);
                    const checked = form.studentIds.includes(sid);
                    return (
                      <label key={sid} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-50">
                        <input type="checkbox" checked={checked} onChange={() => toggleStudent(sid)} className="accent-brand-primary" />
                        <span className="text-sm text-ink-800">{s.fullName}</span>
                        <span className="text-xs text-ink-400 font-mono ml-auto">{s.studentId}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* File */}
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Attach file (optional · PDF, Word, image · max 10MB)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-surface-300 rounded-xl text-xs font-medium text-ink-600 hover:bg-surface-100 transition"
                >
                  <Paperclip size={13} /> {file ? file.name : 'Choose file'}
                </button>
                {file && (
                  <button type="button" onClick={() => setFile(null)} className="text-xs text-red-500 hover:underline">Remove new</button>
                )}
                {editingId && !file && !removeFile && (
                  <button type="button" onClick={() => setRemoveFile(true)} className="text-xs text-red-400 hover:underline">Remove existing file</button>
                )}
                {removeFile && (
                  <span className="text-xs text-red-500 flex items-center gap-1">
                    File will be removed
                    <button type="button" onClick={() => setRemoveFile(false)} className="underline ml-1">Undo</button>
                  </span>
                )}
              </div>
              <input ref={fileRef} type="file" className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60">
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Send Announcement'}
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 border border-surface-300 text-ink-600 text-sm rounded-xl hover:bg-surface-100 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card p-12 text-center">
          <Megaphone size={32} className="mx-auto text-ink-300 mb-3" />
          <p className="text-sm text-ink-400">No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const target = TARGET_LABELS[a.target] || TARGET_LABELS.all;
            const Icon = target.icon;
            const FIcon = fileIcon(a.file?.mimeType);
            return (
              <div key={a.id} className="bg-white rounded-2xl border border-ink-300/20 shadow-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-ink-900">{a.title}</h3>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${target.cls}`}>
                        <Icon size={9} />
                        {a.target === 'course' ? a.course?.title || 'Course' : target.label}
                      </span>
                    </div>
                    <p className="text-sm text-ink-600 whitespace-pre-wrap leading-relaxed">{a.body}</p>
                    {a.file?.url && (
                      <a
                        href={a.file.url} target="_blank" rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-primary hover:underline"
                      >
                        <FIcon size={12} /> {a.file.originalName || 'Attachment'} {a.file.size ? `· ${formatSize(a.file.size)}` : ''}
                        <Download size={11} />
                      </a>
                    )}
                    <p className="text-xs text-ink-300 mt-2">{new Date(a.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { openEdit(a); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="p-1.5 text-ink-300 hover:text-brand-primary transition"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(a.id)} className="p-1.5 text-ink-300 hover:text-red-500 transition" title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
