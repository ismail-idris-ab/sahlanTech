import { useState, useEffect, useCallback } from 'react';
import { Trash2, Eye, CreditCard, Building2 } from 'lucide-react';
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

const PAYMENT_BADGE = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
};

const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed'];

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

  const handleStatusChange = async (id, updates) => {
    try {
      await updateEnrollmentStatus(id, updates);
      toast.success('Status updated.');
      load();
      if (selected?.id === id) setSelected((e) => ({ ...e, ...updates }));
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
    <div className="max-w-5xl">
      <div className="mb-6">
        <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1">Students</p>
        <div className="flex items-baseline gap-3">
          <span className="font-display text-3xl text-ink-900">{meta.total}</span>
          <span className="text-ink-500 text-sm">total enrollments</span>
        </div>
      </div>

      <div className="flex gap-1.5 mb-5 p-1 bg-white rounded-xl border border-ink-300/20 w-fit shadow-card">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-150 ${
              activeTab === tab ? 'bg-brand-primary text-white shadow-sm' : 'text-ink-500 hover:text-ink-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-ink-300/20" />)}
        </div>
      ) : enrollments.length === 0 ? (
        <EmptyState title="No enrollments" description="Enrollment submissions will appear here." />
      ) : (
        <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-300/20">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Student</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden md:table-cell">Course</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden sm:table-cell">Mode</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/15">
              {enrollments.map((enr) => (
                <tr
                  key={enr.id}
                  onClick={() => setSelected(enr)}
                  className="hover:bg-surface-100/60 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink-900">{enr.fullName}</p>
                    <p className="text-ink-400 text-xs">{enr.email}</p>
                  </td>
                  <td className="px-5 py-4 text-ink-600 hidden md:table-cell line-clamp-1">{enr.courseTitleSnapshot}</td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize w-fit ${STATUS_BADGE[enr.status]}`}>
                        {enr.status}
                      </span>
                      {enr.paymentStatus && (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize w-fit ${PAYMENT_BADGE[enr.paymentStatus]}`}>
                          {enr.paymentMethod === 'paystack' ? '💳' : '🏦'} {enr.paymentStatus}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-ink-400 text-xs hidden lg:table-cell">
                    {new Date(enr.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(enr); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-brand-primary hover:bg-brand-primary/8 transition-all"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: enr.id, name: enr.fullName }); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-brand-danger hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={14} />
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

            {/* Payment info */}
            <div className="bg-surface-100 rounded-xl p-4 space-y-2 text-sm border border-ink-300/20">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Payment</p>
              <div className="flex justify-between">
                <span className="text-ink-500">Method</span>
                <span className="font-medium text-ink-900 flex items-center gap-1.5 capitalize">
                  {selected.paymentMethod === 'paystack'
                    ? <><CreditCard size={13} className="text-brand-primary" /> Paystack</>
                    : <><Building2 size={13} className="text-ink-500" /> Bank Transfer</>
                  }
                </span>
              </div>
              {selected.amountPaid > 0 && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Amount</span>
                  <span className="font-bold text-brand-primary">₦{selected.amountPaid.toLocaleString()}</span>
                </div>
              )}
              {selected.paymentRef && (
                <div className="flex justify-between">
                  <span className="text-ink-500">Reference</span>
                  <span className="font-mono text-xs text-ink-700">{selected.paymentRef}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-ink-300/40">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-ink-700">Status:</label>
                <select
                  value={selected.status}
                  onChange={(e) => handleStatusChange(selected.id, { status: e.target.value })}
                  className="border border-ink-300 rounded-lg px-3 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-ink-700">Payment:</label>
                <select
                  value={selected.paymentStatus || 'pending'}
                  onChange={(e) => handleStatusChange(selected.id, { paymentStatus: e.target.value })}
                  className="border border-ink-300 rounded-lg px-3 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  {PAYMENT_STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
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
