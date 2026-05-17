import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
    <div className="min-h-screen flex items-center justify-center bg-surface-100 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-primary font-display">sahlearn.</h1>
          <p className="text-ink-500 text-sm mt-1">Admin Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink-700 mb-1">
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
              className="w-full border border-ink-300 rounded-lg px-4 py-3 text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              placeholder="admin@sahlearn.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-700 mb-1">
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
              className="w-full border border-ink-300 rounded-lg px-4 py-3 text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-brand-danger text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white font-medium py-3 rounded-lg hover:bg-brand-primaryDark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
