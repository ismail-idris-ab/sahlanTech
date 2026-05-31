import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, FileText, MessageSquare, Users,
  ArrowUpRight, TrendingUp, ChevronRight,
  PlusCircle, Edit3, Inbox, GraduationCap,
  ClipboardList, ClipboardCheck,
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
    const cached = sessionStorage.getItem('admin_stats');
    if (cached) {
      try { setStats(JSON.parse(cached)); setLoading(false); } catch (_) {}
    }
    api.get('/api/admin/stats')
      .then((r) => {
        setStats(r.data.data);
        sessionStorage.setItem('admin_stats', JSON.stringify(r.data.data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const v = (key) => {
    if (!stats) return '—';
    if (key === 'courses') return stats.courses.published;
    if (key === 'posts') return stats.posts.published;
    if (key === 'messages') return stats.messages.new;
    if (key === 'enrollments') return stats.enrollments.pending;
    return 0;
  };

  const PulseBars = () => (
    <div className="space-y-2 mt-1">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-2.5 bg-white/20 rounded-full animate-pulse w-24" />
          <div className="h-1.5 bg-white/10 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );

  const WhiteSkeleton = ({ w = 'w-16', h = 'h-9' }) => (
    <div className={`${w} ${h} rounded-lg bg-ink-300/20 animate-pulse`} />
  );

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── Greeting banner ── */}
      <div
        className="relative rounded-2xl overflow-hidden p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, #013F4A 0%, #011F28 100%)' }}
      >
        {/* Decorative orb */}
        <div
          className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #71B280, transparent)' }}
        />
        <div
          className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #C9962A, transparent)' }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#71B280' }}>
              {greeting}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl text-white leading-tight">
              {user?.name?.split(' ')[0] ?? 'Admin'}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#87BAC2' }}>
              Here's what's happening with Sahlearn today.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                to="/admin/courses/new"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #C9962A, #E8B84B)', color: '#011F28' }}
              >
                <PlusCircle size={13} /> New Course
              </Link>
              <Link
                to="/admin/posts/new"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:bg-white/15"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <Edit3 size={13} /> New Post
              </Link>
            </div>
          </div>

          {/* Mini-stat chips */}
          {stats && (
            <div className="flex sm:flex-col gap-3 sm:gap-2 flex-shrink-0">
              <div
                className="flex flex-col px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-2xl font-display text-white leading-none">
                  {stats.students?.total ?? '—'}
                </span>
                <span className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Total students
                </span>
              </div>
              <div
                className="flex flex-col px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <span className="text-2xl font-display leading-none" style={{ color: '#E8B84B' }}>
                  {loading ? '—' : (
                    (stats.messages?.new ?? 0) +
                    (stats.enrollments?.pending ?? 0) +
                    (stats.assignments?.ungraded ?? 0) +
                    (stats.exams?.pendingReview ?? 0)
                  )}
                </span>
                <span className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Pending actions
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">

        {/* Courses — accent card */}
        <Link
          to="/admin/courses"
          className="relative col-span-2 sm:col-span-1 rounded-2xl p-4 sm:p-5 overflow-hidden group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
          style={{ background: 'linear-gradient(145deg, #068562 0%, #013F4A 100%)' }}
        >
          <div className="absolute inset-0 opacity-15"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #71B280 0%, transparent 60%)' }}
          />
          <div className="relative">
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <BookOpen size={16} className="text-white" />
              </div>
              <ArrowUpRight size={15} className="text-white/40 group-hover:text-white transition-colors" />
            </div>
            {loading
              ? <div className="h-9 w-14 rounded-lg bg-white/20 animate-pulse mb-1" />
              : <p className="text-3xl sm:text-4xl font-display text-white leading-none mb-1">{v('courses')}</p>
            }
            <p className="text-xs text-white/70 font-medium">Published Courses</p>
            {stats && (
              <p className="text-[11px] text-white/40 mt-0.5">{stats.courses.total} total</p>
            )}
          </div>
        </Link>

        {/* Posts */}
        <StatCard
          to="/admin/posts"
          icon={FileText}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          value={v('posts')}
          loading={loading && !stats}
          label="Blog Posts"
          sub={stats ? `${stats.posts.total} total` : null}
        />

        {/* Messages */}
        <StatCard
          to="/admin/messages"
          icon={MessageSquare}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          value={v('messages')}
          loading={loading && !stats}
          label="New Messages"
          sub={stats ? `${stats.messages.total} total` : null}
          highlight={!loading && v('messages') > 0}
          highlightColor="text-blue-600"
        />

        {/* Enrollments */}
        <StatCard
          to="/admin/enrollments"
          icon={GraduationCap}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          value={v('enrollments')}
          loading={loading && !stats}
          label="Pending Enrollments"
          sub={stats ? `${stats.enrollments.total} total` : null}
          highlight={!loading && v('enrollments') > 0}
          highlightColor="text-amber-600"
        />
      </div>

      {/* ── Student + assignment stat row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard
          to="/admin/students"
          icon={Users}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          value={loading || !stats ? '—' : stats.students?.active ?? '—'}
          loading={loading && !stats}
          label="Active Students"
          sub={stats?.students ? `${stats.students.total} total` : null}
        />
        <StatCard
          to="/admin/assignments"
          icon={ClipboardList}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          value={loading || !stats ? '—' : stats.assignments?.ungraded ?? '—'}
          loading={loading && !stats}
          label="Ungraded Submissions"
          sub={stats?.assignments ? `${stats.assignments.submissions} total submissions` : null}
          highlight={!loading && stats?.assignments?.ungraded > 0}
          highlightColor="text-purple-600"
        />
        <StatCard
          to="/admin/exams"
          icon={ClipboardCheck}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          value={loading || !stats ? '—' : stats.exams?.pendingReview ?? '—'}
          loading={loading && !stats}
          label="Exam Attempts to Review"
          sub={stats?.exams ? `${stats.exams.attempts} total attempts` : null}
          highlight={!loading && stats?.exams?.pendingReview > 0}
          highlightColor="text-indigo-600"
        />
      </div>

      {/* ── Bottom panels ── */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

          {/* Content health */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-ink-300/20 shadow-card">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-brand-primary" />
                <p className="text-sm font-semibold text-ink-900">Content health</p>
              </div>
              <Link to="/admin/courses" className="text-xs text-brand-primary hover:underline flex items-center gap-0.5">
                View all <ChevronRight size={11} />
              </Link>
            </div>

            <div className="space-y-4">
              {stats && [
                {
                  label: 'Courses',
                  published: stats.courses.published,
                  draft: stats.courses.total - stats.courses.published,
                  total: stats.courses.total,
                  color: '#068562',
                  link: '/admin/courses',
                },
                {
                  label: 'Blog posts',
                  published: stats.posts.published,
                  draft: stats.posts.total - stats.posts.published,
                  total: stats.posts.total,
                  color: '#0d9488',
                  link: '/admin/posts',
                },
              ].map(({ label, published, draft, total, color, link }) => {
                const pct = total > 0 ? Math.round((published / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between items-baseline text-xs mb-2">
                      <span className="font-medium text-ink-700">{label}</span>
                      <div className="flex items-center gap-2 text-ink-400">
                        <span><strong className="text-ink-700">{published}</strong> published</span>
                        {draft > 0 && <span>{draft} draft</span>}
                      </div>
                    </div>
                    <div className="w-full bg-surface-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[11px]" style={{ color }}>{pct}% published</span>
                      <Link to={link} className="text-[11px] text-ink-400 hover:text-brand-primary transition-colors">
                        Manage →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submissions */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-ink-300/20 shadow-card">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="flex items-center gap-2">
                <Inbox size={15} className="text-brand-primary" />
                <p className="text-sm font-semibold text-ink-900">Submissions</p>
              </div>
            </div>

            <div className="space-y-2">
              {stats && [
                {
                  label: 'Messages',
                  icon: MessageSquare,
                  total: stats.messages.total,
                  badge: stats.messages.new,
                  badgeLabel: 'unread',
                  link: '/admin/messages',
                  badgeColor: 'text-blue-600 bg-blue-50',
                  iconColor: 'text-blue-500 bg-blue-50',
                },
                {
                  label: 'Enrollments',
                  icon: GraduationCap,
                  total: stats.enrollments.total,
                  badge: stats.enrollments.pending,
                  badgeLabel: 'pending',
                  link: '/admin/enrollments',
                  badgeColor: 'text-amber-600 bg-amber-50',
                  iconColor: 'text-amber-600 bg-amber-50',
                },
                {
                  label: 'Assignments',
                  icon: ClipboardList,
                  total: stats.assignments?.submissions ?? 0,
                  badge: stats.assignments?.ungraded ?? 0,
                  badgeLabel: 'ungraded',
                  link: '/admin/assignments',
                  badgeColor: 'text-purple-600 bg-purple-50',
                  iconColor: 'text-purple-600 bg-purple-50',
                },
                {
                  label: 'Exams',
                  icon: ClipboardCheck,
                  total: stats.exams?.attempts ?? 0,
                  badge: stats.exams?.pendingReview ?? 0,
                  badgeLabel: 'pending review',
                  link: '/admin/exams',
                  badgeColor: 'text-indigo-600 bg-indigo-50',
                  iconColor: 'text-indigo-600 bg-indigo-50',
                },
              ].map(({ label, icon: Icon, total, badge, badgeLabel, link, badgeColor, iconColor }) => (
                <Link
                  key={label}
                  to={link}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-100 transition-colors group"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-700">{label}</p>
                    <p className="text-xs text-ink-400">{total} total</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {badge > 0 && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {badge} {badgeLabel}
                      </span>
                    )}
                    <ChevronRight size={13} className="text-ink-300 group-hover:text-ink-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Quick links footer */}
            <div className="mt-4 pt-4 border-t border-ink-300/20">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 mb-2">Quick actions</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '+ Course', to: '/admin/courses/new' },
                  { label: '+ Post', to: '/admin/posts/new' },
                  { label: 'View team', to: '/admin/team' },
                ].map(({ label, to }) => (
                  <Link
                    key={to}
                    to={to}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:bg-brand-primary hover:text-white"
                    style={{
                      background: '#EDF4F2',
                      color: '#506860',
                      border: '1px solid rgba(168,196,188,0.4)',
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ to, icon: Icon, iconBg, iconColor, value, loading, label, sub, highlight, highlightColor }) {
  return (
    <Link
      to={to}
      className="rounded-2xl p-4 sm:p-5 bg-white border border-ink-300/20 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 group"
    >
      <div className="flex items-start justify-between mb-4 sm:mb-5">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={15} className={iconColor} />
        </div>
        <ArrowUpRight size={14} className="text-ink-300 group-hover:text-ink-500 transition-colors" />
      </div>
      {loading
        ? <div className="h-8 w-12 rounded-lg bg-ink-300/40 animate-pulse mb-1" />
        : (
          <p className={`text-3xl font-display leading-none mb-1 ${highlight ? highlightColor : 'text-ink-900'}`}>
            {value}
          </p>
        )
      }
      <p className="text-xs font-medium text-ink-500">{label}</p>
      {sub
        ? <p className="text-[11px] text-ink-300 mt-0.5">{sub}</p>
        : loading && <div className="h-2.5 w-16 rounded-full bg-ink-300/30 animate-pulse mt-1" />
      }
    </Link>
  );
}
