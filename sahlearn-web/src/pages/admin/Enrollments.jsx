import { useState, useEffect, useCallback } from 'react';
import { Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminGetEnrollments, updateEnrollmentStatus, deleteEnrollment } from '../../services/enrollments.service';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

const STATUS_TABS = ['all', 'pending', 'contacted', 'enrolled', 'rejected'];

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-700',
  contacted: 'bg-blue-100 text-blue-700',
  enrolled: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = ['pending', 'contacted', 'enrolled', 'rejected'];

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [meta, setMeta] = useState({ total: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const res = await adminGetEnrollments(params);
      setEnrollments(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load enrollments.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateEnrollmentStatus(id, status);
      toast.success('Status updated.');
      load();
      if (selected?.id === id) setSelected((e) => ({ ...e, status }));
    } catch {
      toast.error('Update failed.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteEnrollment(deleteTarget.id);
      toast.success('Enrollment deleted.');
      setDeleteTarget(null);
      if (selected?.id === deleteTarget.id) setSelected(null);
      load();
    } catch {
      toast.error('Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">Enrollments</h1>
        <p className="text-ink-500 text-sm mt-0.5">{meta.total} total</p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-ink-300/40">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              activeTab === tab ? 'border-brand-primary text-brand-primary' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-lg animate-pulse border border-ink-300/40" />)}
        </div>
      ) : enrollments.length === 0 ? (
        <EmptyState title="No enrollments" description="Enrollment submissions will appear here." />
      ) : (
        <div className="bg-white rounded-xl border border-ink-300/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-100 border-b border-ink-300/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-ink-700">Student</th>
                <th className="text-left px-4 py-3 font-medium text-ink-700 hidden md:table-cell">Course</th>
                <th className="text-left px-4 py-3 font-medium text-ink-700 hidden sm:table-cell">Mode</th>
                <th className="text-left px-4 py-3 font-medium text-ink-700 hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium text-ink-700 hidden lg:table-cell">Date</th>
                <th className="text-right px-4 py-3 font-medium text-ink-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/40">
              {enrollments.map((enr) => (
                <tr key={enr.id} className="hover:bg-surface-100/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{enr.fullName}</p>
                    <p className="text-ink-500 text-xs">{enr.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-700 hidden md:table-cell line-clamp-1">{enr.courseTitleSnapshot}</td>
                  <td className="px-4 py-3 text-ink-700 capitalize hidden sm:table-cell">{enr.mode}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[enr.status]}`}>
                      {enr.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500 text-xs hidden lg:table-cell">
                    {new Date(enr.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setSelected(enr)} className="p-1.5 text-ink-500 hover:text-brand-primary transition-colors">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget({ id: enr.id, name: enr.fullName })} className="p-1.5 text-ink-500 hover:text-brand-danger transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Enrollment detail">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-ink-500 text-xs mb-0.5">Name</p><p className="font-medium text-ink-900">{selected.fullName}</p></div>
              <div><p className="text-ink-500 text-xs mb-0.5">Email</p><p className="text-ink-900">{selected.email}</p></div>
              <div><p className="text-ink-500 text-xs mb-0.5">Phone</p><p className="text-ink-900">{selected.phone}</p></div>
              <div><p className="text-ink-500 text-xs mb-0.5">Mode</p><p className="text-ink-900 capitalize">{selected.mode}</p></div>
              {selected.preferredStartDate && (
                <div><p className="text-ink-500 text-xs mb-0.5">Preferred Start</p><p className="text-ink-900">{new Date(selected.preferredStartDate).toLocaleDateString()}</p></div>
              )}
              <div><p className="text-ink-500 text-xs mb-0.5">Submitted</p><p className="text-ink-900">{new Date(selected.createdAt).toLocaleString()}</p></div>
            </div>
            <div><p className="text-ink-500 text-xs mb-0.5">Course</p><p className="font-medium text-ink-900">{selected.courseTitleSnapshot}</p></div>
            {selected.notes && (
              <div><p className="text-ink-500 text-xs mb-1">Notes</p><p className="text-ink-700 whitespace-pre-wrap bg-surface-100 rounded-lg p-3">{selected.notes}</p></div>
            )}
            <div className="flex items-center gap-3 pt-2 border-t border-ink-300/40">
              <label className="text-xs font-medium text-ink-700">Status:</label>
              <select
                value={selected.status}
                onChange={(e) => handleStatusChange(selected.id, e.target.value)}
                className="border border-ink-300 rounded-lg px-3 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete modal */}
      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete enrollment?">
        <p className="text-ink-700 text-sm mb-6">Enrollment from "{deleteTarget?.name}" will be permanently deleted.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
