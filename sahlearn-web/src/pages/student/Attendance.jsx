import { useEffect, useState } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { checkIn, getMyCheckIns } from '../../services/dailyCheckIn.service';
import { getContent } from '../../services/siteContent.service';
import { CalendarCheck, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentAttendance() {
  const { student } = useStudentAuth();
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [attendanceEnabled, setAttendanceEnabled] = useState(true);

  useEffect(() => {
    Promise.all([
      getMyCheckIns(),
      getContent('attendance_enabled').catch(() => null),
    ]).then(([{ checkedInToday: done, records: recs }, enabledData]) => {
      setCheckedInToday(done);
      setRecords(recs);
      if (enabledData && typeof enabledData.enabled === 'boolean') {
        setAttendanceEnabled(enabledData.enabled);
      }
    }).catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckIn = async () => {
    setMarking(true);
    try {
      await checkIn();
      const { checkedInToday: done, records: recs } = await getMyCheckIns();
      setCheckedInToday(done);
      setRecords(recs);
      toast.success('Attendance marked!');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to mark attendance';
      toast.error(msg);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Attendance</h1>
        <p className="text-xs text-ink-400 mt-0.5">Mark your daily attendance</p>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <CalendarCheck size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-ink-900">Today's Attendance</p>
            <p className="text-xs text-ink-400">
              {new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="h-10 w-36 bg-surface-100 rounded-lg animate-pulse" />
        ) : !attendanceEnabled ? (
          <div className="flex items-center gap-2">
            <button
              disabled
              className="px-6 py-2.5 bg-ink-200 text-ink-400 text-sm font-semibold rounded-lg cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              Mark Present
            </button>
            <span className="text-xs text-ink-400">Attendance is currently closed</span>
          </div>
        ) : checkedInToday ? (
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
            <span>You already did your attendance for today</span>
          </div>
        ) : (
          <button
            onClick={handleCheckIn}
            disabled={marking}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            {marking ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Marking...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Mark Present
              </>
            )}
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100">
          <p className="font-semibold text-ink-900">Attendance History</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-14 text-center">
            <Clock size={28} className="text-ink-200 mx-auto mb-2" />
            <p className="text-sm text-ink-400">No attendance records yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-50 text-left text-xs text-ink-500 uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium w-12">#</th>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Reg No.</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {records.map((r, i) => (
                  <tr key={r._id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-3 text-ink-400 text-xs">{i + 1}</td>
                    <td className="px-6 py-3 text-ink-900 font-medium">{student?.fullName || '-'}</td>
                    <td className="px-6 py-3 text-ink-600">{student?.studentId || '-'}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                        <CheckCircle2 size={11} /> Present
                      </span>
                    </td>
                    <td className="px-6 py-3 text-ink-600">{r.date}</td>
                    <td className="px-6 py-3 text-ink-600">{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
