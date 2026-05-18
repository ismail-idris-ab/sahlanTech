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
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0D2018 0%, #0A1C14 60%, #112518 100%)' }}>
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-forest-accent to-brand-primary flex items-center justify-center">
            <Sprout size={18} className="text-forest-950" />
          </div>
          <span className="text-2xl font-display text-white">sahlearn</span>
        </div>
        <div>
          <p className="font-display text-4xl text-white leading-tight mb-4">
            Manage your courses,<br />
            <span className="text-forest-accent">grow your students.</span>
          </p>
          <p className="text-forest-muted text-sm leading-relaxed max-w-sm">
            Your complete dashboard for courses, blog posts, enrollments, and messages — all in one place.
          </p>
        </div>
        <div className="text-xs text-forest-muted">
          © {new Date().getFullYear()} Sahlearn. All rights reserved.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest-accent to-brand-primary flex items-center justify-center">
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
                className="w-full bg-brand-primary text-white font-semibold py-3 rounded-xl hover:bg-brand-primaryDark transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-green mt-2 active:scale-[0.98]"
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
