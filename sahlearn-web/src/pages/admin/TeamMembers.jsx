import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { createAdmin, listAdmins, deleteAdmin } from '../../services/auth.service';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

const EMPTY_FORM = { name: '', email: '', password: '' };

const GRAD = ['linear-gradient(135deg,#068562,#71B280)', 'linear-gradient(135deg,#C9962A,#E8B84B)', 'linear-gradient(135deg,#8b5cf6,#6366f1)', 'linear-gradient(135deg,#3b82f6,#60a5fa)', 'linear-gradient(135deg,#f97316,#fb923c)'];
const avatarGrad = (name) => GRAD[(name?.charCodeAt(0) ?? 0) % GRAD.length];

export default function TeamMembers() {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAdmins();
      setAdmins(data);
    } catch {
      toast.error('Failed to load team members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setCreating(true);
    try {
      await createAdmin(form);
      toast.success('Admin created successfully.');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setErrors({});
      load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create admin.';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAdmin(deleteTarget.id);
      toast.success('Admin removed.');
      setDeleteTarget(null);
      load();
    } catch (err) {
      const msg = err.response?.data?.message || 'Delete failed.';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const field = (key) => ({
    value: form[key],
    onChange: (ev) => {
      setForm((f) => ({ ...f, [key]: ev.target.value }));
      if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
    },
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Team Members</h1>
          <p className="text-xs text-ink-400 mt-0.5">{admins.length} admin{admins.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={<UserPlus size={15} />}>
          Add Member
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-lg animate-pulse border border-ink-300/40" />
          ))}
        </div>
      ) : admins.length === 0 ? (
        <EmptyState title="No admins found" description="Something is wrong — at least one admin should exist." />
      ) : (
        <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-300/20">
              <tr>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Name</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden md:table-cell">Role</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden lg:table-cell">Added</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/15">
              {admins.map((admin) => {
                const isSelf = admin.id === currentUser?.id;
                return (
                  <tr key={admin.id} className="hover:bg-surface-100/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: avatarGrad(admin.name) }}
                        >
                          {admin.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <p className="font-medium text-ink-900">{admin.name}</p>
                        {isSelf && (
                          <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-medium">you</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-600 hidden sm:table-cell">{admin.email}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="flex items-center gap-1 text-xs font-semibold text-brand-primary bg-brand-primary/10 px-2.5 py-0.5 rounded-full w-fit">
                        <ShieldCheck size={11} />
                        Admin
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-ink-400 text-xs hidden lg:table-cell">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => !isSelf && setDeleteTarget({ id: admin.id, name: admin.name })}
                        disabled={isSelf}
                        title={isSelf ? 'Cannot delete your own account' : 'Remove admin'}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ml-auto transition-all ${
                          isSelf
                            ? 'text-ink-300 cursor-not-allowed'
                            : 'text-ink-400 hover:text-brand-danger hover:bg-red-50'
                        }`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Admin modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setForm(EMPTY_FORM); setErrors({}); }} title="Add Admin">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Name</label>
            <input
              type="text"
              placeholder="Full name"
              {...field('name')}
              className={`w-full border rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.name ? 'border-brand-danger' : 'border-ink-300'}`}
            />
            {errors.name && <p className="text-xs text-brand-danger mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Email</label>
            <input
              type="email"
              placeholder="admin@example.com"
              {...field('email')}
              className={`w-full border rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.email ? 'border-brand-danger' : 'border-ink-300'}`}
            />
            {errors.email && <p className="text-xs text-brand-danger mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="Min. 8 characters"
              {...field('password')}
              className={`w-full border rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-primary ${errors.password ? 'border-brand-danger' : 'border-ink-300'}`}
            />
            {errors.password && <p className="text-xs text-brand-danger mt-1">{errors.password}</p>}
          </div>

          <p className="text-xs text-ink-500">This person will have full admin access to the dashboard.</p>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowCreate(false); setForm(EMPTY_FORM); setErrors({}); }}>
              Cancel
            </Button>
            <Button type="submit" loading={creating}>
              Create Admin
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Remove admin?">
        <p className="text-ink-700 text-sm mb-6">
          <strong>{deleteTarget?.name}</strong> will lose all dashboard access. This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>Remove</Button>
        </div>
      </Modal>
    </div>
  );
}
