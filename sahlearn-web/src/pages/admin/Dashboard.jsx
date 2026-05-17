import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, MessageSquare, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CARDS = [
  { key: 'courses', label: 'Published Courses', icon: BookOpen, color: 'text-brand-primary bg-brand-primary/10', link: '/admin/courses' },
  { key: 'posts', label: 'Published Posts', icon: FileText, color: 'text-purple-600 bg-purple-100', link: '/admin/posts' },
  { key: 'messages', label: 'New Messages', icon: MessageSquare, color: 'text-blue-600 bg-blue-100', link: '/admin/messages' },
  { key: 'enrollments', label: 'Pending Enrollments', icon: Users, color: 'text-brand-accent bg-brand-accent/10', link: '/admin/enrollments' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/stats')
      .then((r) => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getValue = (key) => {
    if (!stats) return '—';
    if (key === 'courses') return stats.courses.published;
    if (key === 'posts') return stats.posts.published;
    if (key === 'messages') return stats.messages.new;
    if (key === 'enrollments') return stats.enrollments.pending;
    return '—';
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
        <p className="text-ink-500 mt-1">Welcome back, {user?.name}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {CARDS.map(({ key, label, icon: Icon, color, link }) => (
          <Link
            key={key}
            to={link}
            className="bg-white rounded-xl p-5 border border-ink-300/40 hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink-900">
                {loading ? <span className="inline-block w-6 h-6 rounded bg-ink-300/40 animate-pulse" /> : getValue(key)}
              </p>
              <p className="text-xs text-ink-500 mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {stats && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-5 border border-ink-300/40">
            <p className="text-sm font-medium text-ink-700 mb-3">Content</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Total courses</span><span className="font-medium text-ink-900">{stats.courses.total}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Total posts</span><span className="font-medium text-ink-900">{stats.posts.total}</span></div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-ink-300/40">
            <p className="text-sm font-medium text-ink-700 mb-3">Submissions</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Total messages</span><span className="font-medium text-ink-900">{stats.messages.total}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Total enrollments</span><span className="font-medium text-ink-900">{stats.enrollments.total}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
