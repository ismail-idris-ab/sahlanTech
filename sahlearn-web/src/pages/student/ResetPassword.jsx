import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { studentResetPassword } from '../../services/studentAuth.service';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await studentResetPassword({ token, password: form.password });
      toast.success('Password reset! Please log in.');
      navigate('/student/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-100 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-surface-200 p-8 text-center">
          <p className="text-sm text-ink-500">Invalid reset link.</p>
          <Link to="/student/forgot-password" className="mt-4 block text-sm text-brand-primary hover:underline">Request a new one</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-surface-200 p-8">
        <h1 className="text-2xl font-display text-ink-900 mb-1">Set New Password</h1>
        <p className="text-sm text-ink-400 mb-6">Choose a strong password (min 8 characters)</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            placeholder="New password"
          />
          <input
            type="password"
            required
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            placeholder="Confirm new password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
