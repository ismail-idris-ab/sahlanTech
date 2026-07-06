import { useState, useRef } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { updateProfile, uploadAvatar, deleteAvatar, changePassword } from '../../services/student.service';
import { Camera, Save, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const { student, setStudent } = useStudentAuth();
  const [form, setForm] = useState({
    fullName: student?.fullName || '',
    phone: student?.phone || '',
    dateOfBirth: student?.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
    address: student?.address || '',
    bio: student?.bio || '',
    academicLevel: student?.academicLevel || '',
  });
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ newPassword: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const fileRef = useRef(null);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateProfile(form);
      setStudent((prev) => ({ ...prev, ...updated }));
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { avatar } = await uploadAvatar(file);
      setStudent((prev) => ({ ...prev, avatar }));
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed');
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await deleteAvatar();
      setStudent((prev) => ({ ...prev, avatar: undefined }));
      toast.success('Photo removed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Remove failed');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      await changePassword({ newPassword: pwForm.newPassword });
      toast.success('Password changed');
      setPwForm({ newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const initials = student?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

  return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-2xl font-display text-ink-900">My Profile</h1>

      {/* Avatar */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="relative">
            {student?.avatar?.url ? (
              <img src={student.avatar.url} alt={student.fullName} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold bg-brand-primary/10 text-brand-primary">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-brand-primary rounded-full flex items-center justify-center shadow"
              title="Change photo"
            >
              <Camera size={13} className="text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="font-semibold text-ink-900">{student?.fullName}</p>
            <p className="text-sm text-ink-400">{student?.studentId}</p>
            {student?.avatar?.url && (
              <button onClick={handleRemoveAvatar} className="text-xs text-red-500 hover:underline mt-1">Remove photo</button>
            )}
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-card">
        <h2 className="font-semibold text-ink-900 mb-4">Personal Information</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Full Name</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Academic Level</label>
              <select
                value={form.academicLevel}
                onChange={(e) => setForm({ ...form, academicLevel: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
              >
                <option value="">Select level...</option>
                <option>ND1</option>
                <option>ND2</option>
                <option>HND1</option>
                <option>HND2</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Bio <span className="text-ink-400">(max 300 chars)</span></label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={300}
              rows={3}
              className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-card">
        <h2 className="font-semibold text-ink-900 mb-4 flex items-center gap-2"><Lock size={16} /> Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            required
            minLength={8}
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            placeholder="New password (min 8 chars)"
            className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
          />
          <input
            type="password"
            required
            minLength={8}
            value={pwForm.confirm}
            onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
            placeholder="Confirm new password"
            className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
          />
          <button
            type="submit"
            disabled={pwSaving}
            className="flex items-center gap-2 px-4 py-2 bg-ink-900 text-white text-sm font-semibold rounded-xl hover:bg-ink-800 transition disabled:opacity-60"
          >
            {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
