// sahlearn-web/src/pages/student/Attendance.jsx
import { useEffect, useState } from 'react';
import { getMyAttendance } from '../../services/studentAttendance.service';
import { CheckCircle2, XCircle, Clock, ShieldCheck, ChevronDown, ChevronUp, CalendarCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_DISPLAY = {
  present: { label: 'Present', icon: CheckCircle2, cls: 'text-green-600 bg-green-50' },
  late: { label: 'Late', icon: Clock, cls: 'text-amber-600 bg-amber-50' },
  excused: { label: 'Excused', icon: ShieldCheck, cls: 'text-blue-600 bg-blue-50' },
  absent: { label: 'Absent', icon: XCircle, cls: 'text-red-500 bg-red-50' },
};

const PctRing = ({ pct }) => {
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="52" height="52" className="flex-shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle
        cx="26" cy="26" r={r} fill="none"
        stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
      <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  );
};

function CourseGroup({ group }) {
  const [open, setOpen] = useState(true);
  const pct = group.percentage ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-surface-50 transition text-left"
      >
        <PctRing pct={pct} />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-ink-900">{group.courseTitle}</h2>
          <p className="text-xs text-ink-400 mt-0.5">
            {group.attended} of {group.total} session{group.total !== 1 ? 's' : ''} attended
          </p>
        </div>
        {open ? <ChevronUp size={16} className="text-ink-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-ink-400 flex-shrink-0" />}
      </button>

      {open && group.sessions.length > 0 && (
        <div className="border-t border-surface-100">
          {group.sessions.map((s) => {
            const disp = STATUS_DISPLAY[s.status] || STATUS_DISPLAY.absent;
            const Icon = disp.icon;
            return (
              <div key={s.sessionId} className="flex items-center gap-4 px-6 py-3 border-b border-surface-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-900 truncate">{s.label}</p>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {new Date(s.date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${disp.cls}`}>
                  <Icon size={11} /> {disp.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {open && group.sessions.length === 0 && (
        <div className="px-6 py-4 border-t border-surface-100 text-sm text-ink-400 italic">No sessions recorded yet.</div>
      )}
    </div>
  );
}

export default function StudentAttendance() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAttendance()
      .then(setGroups)
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Attendance</h1>
        <p className="text-xs text-ink-400 mt-0.5">Your attendance per course</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <CalendarCheck size={22} className="text-ink-300" />
          </div>
          <p className="font-semibold text-ink-700">No attendance records yet</p>
          <p className="text-sm text-ink-400 mt-1">Attend sessions to see your record.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => <CourseGroup key={group.courseId || group.courseTitle} group={group} />)}
        </div>
      )}
    </div>
  );
}
