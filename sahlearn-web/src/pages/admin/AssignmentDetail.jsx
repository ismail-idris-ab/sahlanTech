// sahlearn-web/src/pages/admin/AssignmentDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listSubmissions, gradeSubmission } from '../../services/adminAssignments.service';
import { ArrowLeft, Pencil, ExternalLink, FileText, Users } from 'lucide-react';
import toast from 'react-hot-toast';

function GradeForm({ submission, onGraded }) {
  const [form, setForm] = useState({
    grade: submission.grade || '',
    feedback: submission.feedback || '',
    status: submission.status || 'submitted',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await gradeSubmission(submission._id, form);
      onGraded(updated);
      toast.success('Feedback saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="mt-3 pt-3 border-t border-surface-100 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-ink-500 mb-0.5">Grade</label>
          <input
            type="text"
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            placeholder="e.g. A, 85/100, Pass"
            maxLength={20}
            className="w-full px-2.5 py-1.5 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-ink-500 mb-0.5">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
          >
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-medium text-ink-500 mb-0.5">Feedback</label>
        <textarea
          value={form.feedback}
          onChange={(e) => setForm({ ...form, feedback: e.target.value })}
          maxLength={2000}
          rows={2}
          placeholder="Write feedback for the student..."
          className="w-full px-2.5 py-1.5 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:bg-brand-primary/90 transition disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save Feedback'}
      </button>
    </form>
  );
}

export default function AdminAssignmentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null); // { assignment, submissions[] }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSubmissions(id)
      .then(setData)
      .catch(() => toast.error('Failed to load submissions'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleGraded = (submissionId, updated) => {
    setData((prev) => ({
      ...prev,
      submissions: prev.submissions.map((s) => (s._id === submissionId ? updated : s)),
    }));
  };

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!data) {
    return <div className="text-center py-12 text-ink-500">Assignment not found. <Link to="/admin/assignments" className="text-brand-primary hover:underline">Back</Link></div>;
  }

  const { assignment, submissions } = data;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/admin/assignments" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900 transition">
          <ArrowLeft size={14} /> Assignments
        </Link>
      </div>

      {/* Assignment header */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display text-ink-900">{assignment.title}</h1>
            <p className="text-sm text-ink-400 mt-0.5">{assignment.course?.title}</p>
          </div>
          <Link to={`/admin/assignments/${id}/edit`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-surface-300 rounded-xl hover:bg-surface-100 transition flex-shrink-0">
            <Pencil size={12} /> Edit
          </Link>
        </div>
        {assignment.dueDate && (
          <p className="text-sm text-ink-500 mt-3">
            <strong>Due:</strong> {new Date(assignment.dueDate).toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        {assignment.description && (
          <p className="text-sm text-ink-700 mt-3 whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
        )}
      </div>

      {/* Submissions */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users size={16} className="text-ink-400" />
          <h2 className="font-semibold text-ink-900">Submissions ({submissions.length})</h2>
        </div>

        {submissions.length === 0 ? (
          <p className="text-sm text-ink-400">No submissions yet.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((s) => {
              const initials = s.student?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
              return (
                <div key={s._id} className="border border-surface-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {s.student?.avatar?.url ? (
                      <img src={s.student.avatar.url} alt={s.student.fullName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 text-sm">{s.student?.fullName}</p>
                      <p className="text-xs text-ink-400 font-mono">{s.student?.studentId}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.status === 'graded' || s.status === 'returned' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                        {s.status}
                      </span>
                      {s.grade && <span className="text-xs font-bold text-brand-primary">{s.grade}</span>}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                    <FileText size={12} />
                    <a href={s.file?.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline flex items-center gap-1">
                      {s.file?.originalName || 'View file'} <ExternalLink size={11} />
                    </a>
                    <span className="text-ink-300">·</span>
                    <span>{new Date(s.submittedAt).toLocaleDateString('en-NG')}</span>
                  </div>

                  {s.note && <p className="mt-1 text-xs text-ink-500 italic">"{s.note}"</p>}

                  <GradeForm submission={s} onGraded={(updated) => handleGraded(s._id, updated)} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
