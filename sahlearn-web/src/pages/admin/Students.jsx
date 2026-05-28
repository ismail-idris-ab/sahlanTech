import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getStudents } from '../../services/adminStudents.service';
import { Search, ChevronRight, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudents({ page, search });
      setStudents(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Students</h1>
          <p className="text-sm text-ink-400">{meta.total} total student{meta.total !== 1 ? 's' : ''}</p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search name, email, ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary w-56"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-ink-400 text-sm">No students found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 text-left">
                <th className="px-4 py-3 font-medium text-ink-500">Student</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden sm:table-cell">ID</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden md:table-cell">Temp Password</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden lg:table-cell">Courses</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden lg:table-cell">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-surface-50 transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink-900">{s.fullName}</div>
                    <div className="text-xs text-ink-400">{s.email}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-500 hidden sm:table-cell font-mono text-xs">{s.studentId}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {s.tempPassword
                      ? <span className="font-mono text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{s.tempPassword}</span>
                      : <span className="text-xs text-ink-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-500 hidden lg:table-cell">{s.enrolledCourses?.length || 0}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${s.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {s.isActive ? <><UserCheck size={11} /> Active</> : <><UserX size={11} /> Inactive</>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/students/${s.id}`} className="inline-flex items-center gap-1 text-xs text-brand-primary hover:underline font-medium">
                      View <ChevronRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-sm border border-surface-300 rounded-xl disabled:opacity-40 hover:bg-surface-100 transition">Prev</button>
          <span className="px-3 py-1.5 text-sm text-ink-500">{page} / {meta.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page === meta.totalPages} className="px-3 py-1.5 text-sm border border-surface-300 rounded-xl disabled:opacity-40 hover:bg-surface-100 transition">Next</button>
        </div>
      )}
    </div>
  );
}
