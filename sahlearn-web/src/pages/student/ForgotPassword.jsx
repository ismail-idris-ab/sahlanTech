import { useState } from 'react';
import { Link } from 'react-router-dom';
import { studentForgotPassword } from '../../services/studentAuth.service';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await studentForgotPassword({ email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-100 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-surface-200 p-8 text-center">
          <h1 className="text-xl font-display text-ink-900 mb-2">Check your email</h1>
          <p className="text-sm text-ink-500 mb-4">If that email is registered, a reset link has been sent.</p>
          <Link to="/student/login" className="text-sm text-brand-primary hover:underline">Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-surface-200 p-8">
        <h1 className="text-2xl font-display text-ink-900 mb-1">Forgot Password</h1>
        <p className="text-sm text-ink-400 mb-6">Enter your email to receive a reset link</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            placeholder="your@email.com"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-ink-400">
          <Link to="/student/login" className="text-brand-primary hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
