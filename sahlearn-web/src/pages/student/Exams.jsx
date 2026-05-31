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
      <div>
        <h1 className="text-2xl font-display text-ink-900">Exams</h1>
        <p className="text-xs text-ink-400 mt-0.5">{exams.length} exam{exams.length !== 1 ? 's' : ''}</p>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <ClipboardCheck size={22} className="text-ink-300" />
          </div>
          <p className="font-semibold text-ink-700">No exams available yet</p>
          <p className="text-sm text-ink-400 mt-1">Check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <Link
              key={exam._id || exam.id}
              to={`/student/exams/${exam._id || exam.id}`}
              className="bg-white rounded-2xl border border-surface-200 p-4 hover:shadow-card-hover transition-all duration-200 block"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-ink-900 leading-snug">{exam.title}</h3>
                <StatusBadge exam={exam} />
              </div>
              <p className="text-xs text-ink-400 mb-3">{exam.course?.title}</p>
              {exam.dueDate && (
                <p className="text-xs text-ink-500 mb-3">
                  Due {new Date(exam.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
              <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden mb-3">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: exam.myAttempt ? '100%' : '0%',
                    background: exam.myAttempt?.status === 'reviewed' ? 'linear-gradient(90deg, #8b5cf6, #6366f1)' : 'linear-gradient(90deg, #068562, #71B280)',
                  }}
                />
              </div>
              {exam.myAttempt ? (
                <p className="text-xs font-semibold text-ink-600">
                  Score: {exam.myAttempt.score} / {exam.myAttempt.maxScore}
                </p>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                  style={{ background: !(exam.dueDate && new Date(exam.dueDate) < new Date()) ? 'linear-gradient(135deg, #068562, #056B4E)' : '#A8C4BC' }}
                >
                  {exam.dueDate && new Date(exam.dueDate) < new Date() ? 'Overdue' : 'Start Exam'}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
