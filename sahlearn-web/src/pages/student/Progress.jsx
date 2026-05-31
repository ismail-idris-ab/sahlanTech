// sahlearn-web/src/pages/student/Progress.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ClipboardCheck, ClipboardList, ChevronDown, ChevronUp, Clock, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

const pct = (score, max) => (max > 0 ? Math.round((score / max) * 100) : 0);

const ScoreBar = ({ score, max }) => {
  const percent = pct(score, max);
  const color =
    percent >= 70 ? 'bg-green-500' : percent >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs font-mono text-ink-500 w-10 text-right">{percent}%</span>
    </div>
  );
};

function CourseSection({ group }) {
  const [open, setOpen] = useState(true);

  const gradedExams = group.exams.filter((e) => e.maxScore > 0);
  const examAvg = gradedExams.length
    ? Math.round(gradedExams.reduce((s, e) => s + pct(e.score, e.maxScore), 0) / gradedExams.length)
    : null;

  const gradedAssignments = group.assignments.filter((a) => a.score != null);
  const assignAvg = gradedAssignments.length
    ? Math.round(gradedAssignments.reduce((s, a) => s + pct(a.score, a.maxScore), 0) / gradedAssignments.length)
    : null;

  const hasActivity = group.exams.length > 0 || group.assignments.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-surface-50 transition text-left"
      >
        <div>
          <h2 className="font-semibold text-ink-900">{group.courseTitle || 'Unknown Course'}</h2>
          <div className="flex items-center gap-4 mt-1 text-xs text-ink-400">
            <span>{group.exams.length} exam{group.exams.length !== 1 ? 's' : ''}</span>
            <span>{group.assignments.length} assignment{group.assignments.length !== 1 ? 's' : ''}</span>
            {examAvg != null && <span className="text-brand-primary font-medium">Exam avg: {examAvg}%</span>}
            {assignAvg != null && <span className="text-brand-primary font-medium">Assignment avg: {assignAvg}%</span>}
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-ink-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-ink-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-6 pb-5 border-t border-surface-100 space-y-5 pt-4">
          {!hasActivity && (
            <p className="text-sm text-ink-400 italic">No submissions yet for this course.</p>
          )}

          {group.exams.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck size={14} className="text-ink-400" />
                <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Exams</h3>
              </div>
              <div className="space-y-3">
                {group.exams.map((e) => (
                  <div key={e.examId} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/student/exams/${e.examId}`}
                        className="text-sm text-ink-900 hover:text-brand-primary transition truncate"
                      >
                        {e.title}
                      </Link>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {e.isPendingEssayReview && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
                            <Clock size={9} /> Pending
                          </span>
                        )}
                        <span className="text-sm font-bold text-ink-900 font-mono">
                          {e.score}<span className="text-ink-400 font-normal">/{e.maxScore}</span>
                        </span>
                      </div>
                    </div>
                    <ScoreBar score={e.score} max={e.maxScore} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {group.assignments.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList size={14} className="text-ink-400" />
                <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Assignments</h3>
              </div>
              <div className="space-y-3">
                {group.assignments.map((a) => (
                  <div key={a.assignmentId} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/student/assignments/${a.assignmentId}`}
                        className="text-sm text-ink-900 hover:text-brand-primary transition truncate"
                      >
                        {a.title}
                      </Link>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {a.score == null ? (
                          <span className="text-xs text-ink-400 italic">Not graded</span>
                        ) : (
                          <span className="text-sm font-bold text-ink-900 font-mono">
                            {a.score}<span className="text-ink-400 font-normal">/{a.maxScore}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {a.score != null && <ScoreBar score={a.score} max={a.maxScore} />}
                    {a.feedback && (
                      <p className="text-xs text-ink-500 italic mt-0.5">"{a.feedback}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentProgress() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/student/progress', { headers: authHeader() })
      .then(({ data }) => setGroups(data.data || []))
      .catch(() => toast.error('Failed to load progress'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display text-ink-900">My Progress</h1>
        <p className="text-xs text-ink-400 mt-0.5">Scores and results across all your courses</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <BarChart2 size={22} className="text-ink-300" />
          </div>
          <p className="font-semibold text-ink-700">No graded work yet</p>
          <p className="text-sm text-ink-400 mt-1">Complete assignments and exams to see your progress.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, i) => <CourseSection key={i} group={group} />)}
        </div>
      )}
    </div>
  );
}
