// sahlearn-web/src/pages/student/Assignments.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssignments } from '../../services/studentAssignments.service';
import { ClipboardList, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function StatusBadge({ submission, dueDate }) {
  if (!submission) {
    const overdue = dueDate && new Date(dueDate) < new Date();
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${overdue ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
        {overdue ? <AlertCircle size={11} /> : <Clock size={11} />}
        {overdue ? 'Overdue' : 'Pending'}
      </span>
    );
  }
  if (submission.status === 'graded' || submission.status === 'returned') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700">
        <CheckCircle2 size={11} /> {submission.grade ? `Graded: ${submission.grade}` : 'Graded'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
      <CheckCircle2 size={11} /> Submitted
    </span>
  );
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAssignments({ limit: 50 })
      .then((res) => setAssignments(res.data))
      .catch(() => toast.error('Failed to load assignments'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Assignments</h1>
        <p className="text-xs text-ink-400 mt-0.5">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <ClipboardList size={22} className="text-ink-300" />
          </div>
          <p className="font-semibold text-ink-700">No assignments yet</p>
          <p className="text-sm text-ink-400 mt-1">Check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assignments.map((a) => (
            <Link
              key={a._id}
              to={`/student/assignments/${a._id}`}
              className="bg-white rounded-2xl border border-surface-200 p-4 hover:shadow-card-hover transition-all duration-200 block"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-ink-900 leading-snug">{a.title}</h3>
                <StatusBadge submission={a.mySubmission} dueDate={a.dueDate} />
              </div>
              <p className="text-xs text-ink-400 mb-3">{a.course?.title}</p>
              {a.description && (
                <p className="text-xs text-ink-600 line-clamp-2 mb-3">{a.description}</p>
              )}
              <div>
                <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: a.mySubmission ? '100%' : '0%',
                      background: a.mySubmission ? 'linear-gradient(90deg, #068562, #71B280)' : 'transparent',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-ink-400">
                    {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'No due date'}
                  </span>
                  {a.mySubmission?.grade && (
                    <span className="text-[10px] font-semibold text-green-600">Score: {a.mySubmission.grade}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
