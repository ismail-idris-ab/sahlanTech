import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Sprout, AlertCircle } from 'lucide-react';
import { login as loginService } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;
  if (user) return <Navigate to="/admin" replace />;

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user: userData } = await loginService(form.email, form.password);
      login(token, userData);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex sidebar-stripe" style={{ background: 'linear-gradient(160deg, #013F4A 0%, #011F28 100%)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #C9962A, #E8B84B)', boxShadow: '0 4px 12px rgba(201,150,42,0.4)' }}
          >
            <Sprout size={18} className="text-forest-950" />
          </div>
          <span className="text-2xl font-display text-white">sahlearn</span>
        </div>

        {/* Gold accent line — inspired by image 2 */}
        <div className="my-8 gold-divider" />

        <div>
          <p className="font-display text-4xl text-white leading-tight mb-4">
            Manage your courses,<br />
            <span style={{ color: '#71B280' }}>grow your students.</span>
          </p>
          <p className="text-sm leading-relaxed max-w-sm" style={{ color: '#87BAC2' }}>
            Your complete dashboard for courses, blog posts, enrollments, and messages — all in one place.
          </p>
        </div>
        <div className="text-xs" style={{ color: '#87BAC2' }}>
          © {new Date().getFullYear()} Sahlearn. All rights reserved.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C9962A, #E8B84B)' }}>
              <Sprout size={15} className="text-forest-950" />
            </div>
            <span className="text-xl font-display text-white">sahlearn</span>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="font-display text-2xl text-ink-900 mb-1">Welcome back</h2>
            <p className="text-ink-500 text-sm mb-7">Sign in to your admin dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-ink-300/70 rounded-xl px-4 py-3 text-sm text-ink-900 bg-surface-50 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                  placeholder="admin@sahlearn.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-ink-700 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full border border-ink-300/70 rounded-xl px-4 py-3 text-sm text-ink-900 bg-surface-50 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mt-2 active:scale-[0.97] btn-shimmer"
              style={{ background: 'linear-gradient(135deg, #068562, #0AA070, #068562)', backgroundSize: '200% auto', boxShadow: '0 4px 16px rgba(6,133,98,0.35)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
