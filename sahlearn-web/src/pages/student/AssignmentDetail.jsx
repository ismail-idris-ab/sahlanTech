// sahlearn-web/src/pages/student/AssignmentDetail.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAssignment, submitAssignment } from '../../services/studentAssignments.service';
import { ArrowLeft, Upload, FileText, CheckCircle2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const ACCEPTED = '.pdf,.doc,.docx,.zip,.jpg,.jpeg,.png,.webp';

export default function AssignmentDetail() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    getAssignment(id)
      .then(setAssignment)
      .catch(() => toast.error('Assignment not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    setSubmitting(true);
    try {
      const submission = await submitAssignment(id, file, note);
      setAssignment((prev) => ({ ...prev, mySubmission: submission }));
      setFile(null);
      setNote('');
      toast.success('Assignment submitted!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!assignment) {
    return <div className="text-center py-12 text-ink-500">Assignment not found. <Link to="/student/assignments" className="text-brand-primary hover:underline">Back</Link></div>;
  }

  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
  const submitted = !!assignment.mySubmission;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/student/assignments" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900 transition">
          <ArrowLeft size={14} /> Assignments
        </Link>
      </div>

      {/* Assignment info */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-xl font-display text-ink-900">{assignment.title}</h1>
          {isOverdue && !submitted && (
            <span className="flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-50 text-red-700">Overdue</span>
          )}
        </div>
        <p className="text-xs text-ink-400 mb-3">{assignment.course?.title}</p>
        {assignment.dueDate && (
          <p className="text-sm text-ink-500 mb-3">
            <strong>Due:</strong> {new Date(assignment.dueDate).toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        {assignment.description && (
          <p className="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
        )}
      </div>

      {/* Submission status */}
      {submitted ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-green-600" />
            <h2 className="font-semibold text-ink-900">Submission Received</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-ink-700">
              <FileText size={14} className="text-ink-400" />
              <a href={assignment.mySubmission.file?.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline flex items-center gap-1">
                {assignment.mySubmission.file?.originalName || 'View file'} <ExternalLink size={12} />
              </a>
            </div>
            {assignment.mySubmission.note && (
              <p className="text-ink-500 text-xs mt-1">Note: {assignment.mySubmission.note}</p>
            )}
            <p className="text-xs text-ink-400">Submitted: {new Date(assignment.mySubmission.submittedAt).toLocaleDateString('en-NG')}</p>
          </div>

          {(assignment.mySubmission.grade || assignment.mySubmission.feedback) && (
            <div className="mt-4 pt-4 border-t border-surface-200">
              <p className="text-xs font-semibold text-ink-600 uppercase tracking-wide mb-2">Feedback</p>
              {assignment.mySubmission.grade && (
                <p className="text-sm font-bold text-brand-primary">Grade: {assignment.mySubmission.grade}</p>
              )}
              {assignment.mySubmission.feedback && (
                <p className="text-sm text-ink-700 mt-1 whitespace-pre-wrap">{assignment.mySubmission.feedback}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 p-6">
          <h2 className="font-semibold text-ink-900 mb-4">Submit Assignment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">File <span className="text-ink-400">(PDF, Word, ZIP, or image — max 10MB)</span></label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-surface-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-primary/50 transition"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-ink-700">
                    <FileText size={16} className="text-brand-primary" />
                    {file.name} <span className="text-ink-400">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} className="mx-auto text-ink-300 mb-2" />
                    <p className="text-sm text-ink-400">Click to select file</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={(e) => setFile(e.target.files[0] || null)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Note <span className="text-ink-400">(optional)</span></label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Any notes for your instructor..."
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !file}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
            >
              <Upload size={15} />
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
