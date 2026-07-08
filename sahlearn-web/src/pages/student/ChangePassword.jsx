import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStudentAuth } from '../../context/StudentAuthContext';
import api from '../../services/api';

export default function StudentChangePassword() {
  const { student, setStudent, getToken } = useStudentAuth();
  const navigate = useNavigate();

  if (!student) {
    navigate('/student/login', { replace: true });
    return null;
  }
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const token = getToken();
      await api.patch(
        '/api/student/me/set-password',
        { password: form.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudent((s) => ({ ...s, mustChangePassword: false }));
      toast.success('Password changed. Welcome!');
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-brand-primary" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900 font-display">Set Your Password</h1>
          <p className="text-ink-500 text-sm mt-1">
            Hi {student?.fullName?.split(' ')[0] || 'there'}! Choose a new password to secure your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-card space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">New Password</label>
            <div className="relative">
              <input
                type={show.password ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                className="w-full border border-ink-300 rounded-lg px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, password: !s.password }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              >
                {show.password ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={show.confirm ? 'text' : 'password'}
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat password"
                required
                className="w-full border border-ink-300 rounded-lg px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              />
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
              >
                {show.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primaryDark transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Saving...' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
