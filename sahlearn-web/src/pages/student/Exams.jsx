// sahlearn-web/src/pages/student/Exams.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getExams } from '../../services/studentExams.service';
import { ClipboardCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function StatusBadge({ exam }) {
  const { myAttempt, dueDate } = exam;

  if (myAttempt) {
    if (myAttempt.status === 'reviewed') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
          <CheckCircle2 size={11} /> Reviewed — {myAttempt.score}/{myAttempt.maxScore}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
        <CheckCircle2 size={11} /> Submitted — {myAttempt.score}/{myAttempt.maxScore}
      </span>
    );
  }

  if (dueDate && new Date(dueDate) < new Date()) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-50 text-red-700">
        <AlertCircle size={11} /> Overdue
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
      <Clock size={11} /> Pending
    </span>
  );
}

export default function StudentExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExams()
      .then((res) => setExams(res.data || []))
      .catch(() => toast.error('Failed to load exams'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-display text-ink-900">Exams</h1>

      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center">
          <ClipboardCheck size={40} className="mx-auto text-ink-300 mb-3" />
          <p className="text-ink-500">No exams available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              to={`/student/exams/${exam.id}`}
              className="block bg-white rounded-2xl border border-surface-200 p-5 hover:border-brand-primary/30 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-ink-900 truncate">{exam.title}</h2>
                  <p className="text-sm text-ink-400 mt-0.5">{exam.course?.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-ink-400">
                    <span>{exam.questions?.length || 0} question{exam.questions?.length !== 1 ? 's' : ''}</span>
                    <span>{exam.totalPoints} point{exam.totalPoints !== 1 ? 's' : ''}</span>
                    {exam.duration && <span>{exam.duration} min</span>}
                    {exam.dueDate && (
                      <span>Due {new Date(exam.dueDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>
                <StatusBadge exam={exam} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
