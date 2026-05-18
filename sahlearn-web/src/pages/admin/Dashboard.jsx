import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, FileText, MessageSquare, Users,
  ArrowUpRight, TrendingUp, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    api.get('/api/admin/stats')
      .then((r) => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const v = (key) => {
    if (!stats) return null;
    if (key === 'courses') return stats.courses.published;
    if (key === 'posts') return stats.posts.published;
    if (key === 'messages') return stats.messages.new;
    if (key === 'enrollments') return stats.enrollments.pending;
    return 0;
  };

  const Skeleton = ({ w = 'w-12', h = 'h-9' }) => (
    <div className={`${w} ${h} rounded-lg bg-white/20 animate-pulse`} />
  );

  const WhiteSkeleton = ({ w = 'w-10', h = 'h-8' }) => (
    <div className={`${w} ${h} rounded-lg bg-ink-300/30 animate-pulse`} />
  );

  return (
    <div className="max-w-5xl">
      {/* Greeting */}
      <div className="mb-7">
        <p className="text-sm text-brand-primary font-medium mb-0.5">{greeting}</p>
        <h1 className="font-display text-3xl text-ink-900">{user?.name?.split(' ')[0] ?? 'Admin'}</h1>
        <p className="text-sm text-ink-500 mt-1">Here's what's happening with Sahlearn today.</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">

        {/* Hero card — Courses */}
        <Link
          to="/admin/courses"
          className="relative col-span-2 lg:col-span-1 rounded-2xl p-5 overflow-hidden group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          style={{ background: 'linear-gradient(145deg, #16A34A 0%, #0D2018 100%)' }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #4ADE80 0%, transparent 60%)' }}
          />
          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <BookOpen size={18} className="text-white" />
              </div>
              <ArrowUpRight size={16} className="text-white/50 group-hover:text-white transition-colors" />
            </div>
            {loading ? <Skeleton /> : (
              <p className="text-4xl font-display text-white leading-none mb-1">{v('courses')}</p>
            )}
            <p className="text-sm text-white/70 font-medium">Published Courses</p>
            {stats && (
              <p className="text-xs text-white/50 mt-1">{stats.courses.total} total</p>
            )}
          </div>
        </Link>

        {/* Posts */}
        <Link
          to="/admin/posts"
          className="rounded-2xl p-5 bg-white border border-ink-300/20 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 group"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
              <FileText size={16} className="text-teal-600" />
            </div>
            <ArrowUpRight size={14} className="text-ink-300 group-hover:text-ink-500 transition-colors" />
          </div>
          {loading ? <WhiteSkeleton /> : (
            <p className="text-3xl font-display text-ink-900 leading-none mb-1">{v('posts')}</p>
          )}
          <p className="text-xs font-medium text-ink-500">Blog Posts</p>
        </Link>

        {/* Messages */}
        <Link
          to="/admin/messages"
          className="rounded-2xl p-5 bg-white border border-ink-300/20 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 group"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <MessageSquare size={16} className="text-blue-500" />
            </div>
            <ArrowUpRight size={14} className="text-ink-300 group-hover:text-ink-500 transition-colors" />
          </div>
          {loading ? <WhiteSkeleton /> : (
            <p className="text-3xl font-display text-ink-900 leading-none mb-1">{v('messages')}</p>
          )}
          <p className="text-xs font-medium text-ink-500">New Messages</p>
        </Link>

        {/* Enrollments */}
        <Link
          to="/admin/enrollments"
          className="rounded-2xl p-5 bg-white border border-ink-300/20 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 group"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Users size={16} className="text-amber-600" />
            </div>
            <ArrowUpRight size={14} className="text-ink-300 group-hover:text-ink-500 transition-colors" />
          </div>
          {loading ? <WhiteSkeleton /> : (
            <p className="text-3xl font-display text-ink-900 leading-none mb-1">{v('enrollments')}</p>
          )}
          <p className="text-xs font-medium text-ink-500">Pending Enrollments</p>
        </Link>
      </div>

      {/* ── Bottom panels ── */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Content health */}
          <div className="bg-white rounded-2xl p-5 border border-ink-300/20 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-brand-primary" />
                <p className="text-sm font-semibold text-ink-900">Content health</p>
              </div>
              <Link to="/admin/courses" className="text-xs text-brand-primary hover:underline flex items-center gap-0.5">
                View all <ChevronRight size={11} />
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Courses', published: stats.courses.published, total: stats.courses.total, color: 'bg-brand-primary' },
                { label: 'Blog posts', published: stats.posts.published, total: stats.posts.total, color: 'bg-teal-500' },
              ].map(({ label, published, total, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-ink-500">{label}</span>
                    <span className="font-medium text-ink-700">{published} <span className="text-ink-300">/ {total} published</span></span>
                  </div>
                  <div className="w-full bg-surface-100 rounded-full h-1.5">
                    <div
                      className={`${color} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: total > 0 ? `${(published / total) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submissions */}
          <div className="bg-white rounded-2xl p-5 border border-ink-300/20 shadow-card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-brand-primary" />
                <p className="text-sm font-semibold text-ink-900">Submissions</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Messages', total: stats.messages.total, badge: stats.messages.new, badgeLabel: 'unread', link: '/admin/messages', color: 'text-blue-600 bg-blue-50' },
                { label: 'Enrollments', total: stats.enrollments.total, badge: stats.enrollments.pending, badgeLabel: 'pending', link: '/admin/enrollments', color: 'text-amber-600 bg-amber-50' },
              ].map(({ label, total, badge, badgeLabel, link, color }) => (
                <Link
                  key={label}
                  to={link}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-100 transition-colors group"
                >
                  <span className="text-sm text-ink-700 font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    {badge > 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
                        {badge} {badgeLabel}
                      </span>
                    )}
                    <span className="text-sm font-bold text-ink-900">{total}</span>
                    <ChevronRight size={13} className="text-ink-300 group-hover:text-ink-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
