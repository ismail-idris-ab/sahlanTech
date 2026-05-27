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
      <h1 className="text-2xl font-display text-ink-900">Assignments</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center">
          <ClipboardList size={40} className="mx-auto text-ink-300 mb-3" />
          <p className="text-ink-400 text-sm">No assignments yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden divide-y divide-surface-100">
          {assignments.map((a) => (
            <Link
              key={a._id}
              to={`/student/assignments/${a._id}`}
              className="flex items-start gap-4 px-5 py-4 hover:bg-surface-50 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ClipboardList size={18} className="text-brand-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-medium text-ink-900 truncate">{a.title}</p>
                  <StatusBadge submission={a.mySubmission} dueDate={a.dueDate} />
                </div>
                <p className="text-xs text-ink-400 mt-0.5">{a.course?.title}</p>
                {a.dueDate && (
                  <p className="text-xs text-ink-400 mt-0.5">
                    Due: {new Date(a.dueDate).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                {a.description && (
                  <p className="text-xs text-ink-500 mt-1 line-clamp-2">{a.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
