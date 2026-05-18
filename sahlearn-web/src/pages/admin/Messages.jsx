import { useState, useEffect, useCallback } from 'react';
import { Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminGetMessages, updateMessageStatus, deleteMessage } from '../../services/contact.service';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

const STATUS_TABS = ['all', 'new', 'read', 'replied', 'archived'];

const STATUS_BADGE = {
  new: 'bg-blue-100 text-blue-700',
  read: 'bg-ink-100 text-ink-600',
  replied: 'bg-green-100 text-green-700',
  archived: 'bg-ink-100 text-ink-400',
};

const STATUS_OPTIONS = ['new', 'read', 'replied', 'archived'];

export default function Messages() {
  const [messages, setMessages] = useState([]);
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
      const res = await adminGetMessages(params);
      setMessages(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateMessageStatus(id, status);
      toast.success('Status updated.');
      load();
      if (selected?.id === id) setSelected((m) => ({ ...m, status }));
    } catch {
      toast.error('Update failed.');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteMessage(deleteTarget.id);
      toast.success('Message deleted.');
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
        <p className="text-xs font-semibold text-brand-primary uppercase tracking-wider mb-1">Inbox</p>
        <div className="flex items-baseline gap-3">
          <span className="font-display text-3xl text-ink-900">{meta.total}</span>
          <span className="text-ink-500 text-sm">total messages</span>
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
      ) : messages.length === 0 ? (
        <EmptyState title="No messages" description="Contact submissions will appear here." />
      ) : (
        <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-300/20">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden md:table-cell">Subject</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden sm:table-cell">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-ink-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/15">
              {messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-surface-100/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink-900">{msg.name}</p>
                    <p className="text-ink-400 text-xs">{msg.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-ink-600 hidden md:table-cell line-clamp-1">{msg.subject}</td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[msg.status]}`}>
                      {msg.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-400 text-xs hidden lg:table-cell">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelected(msg)} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-brand-primary hover:bg-brand-primary/8 transition-all">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget({ id: msg.id, name: msg.name })} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-brand-danger hover:bg-red-50 transition-all">
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
      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Message detail">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-ink-500 text-xs mb-0.5">Name</p><p className="font-medium text-ink-900">{selected.name}</p></div>
              <div><p className="text-ink-500 text-xs mb-0.5">Email</p><p className="text-ink-900">{selected.email}</p></div>
              {selected.phone && <div><p className="text-ink-500 text-xs mb-0.5">Phone</p><p className="text-ink-900">{selected.phone}</p></div>}
              <div><p className="text-ink-500 text-xs mb-0.5">Date</p><p className="text-ink-900">{new Date(selected.createdAt).toLocaleString()}</p></div>
            </div>
            <div><p className="text-ink-500 text-xs mb-0.5">Subject</p><p className="font-medium text-ink-900">{selected.subject}</p></div>
            <div><p className="text-ink-500 text-xs mb-1">Message</p><p className="text-ink-700 whitespace-pre-wrap bg-surface-100 rounded-lg p-3">{selected.message}</p></div>
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
      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete message?">
        <p className="text-ink-700 text-sm mb-6">Message from "{deleteTarget?.name}" will be permanently deleted.</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
