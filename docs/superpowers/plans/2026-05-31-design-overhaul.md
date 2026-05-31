# Design Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign both admin and student portals with consistent Bold & Branded visual language — new student layout shell, richer dashboards, Pattern A/B/D applied to all list/detail/student pages.

**Architecture:** UI-only changes. No new API endpoints, no schema changes, no new routes. All business logic (state, service calls, modals, handlers) is preserved in every file — only JSX structure and Tailwind classes change. Start dev server once at the beginning and keep it running for visual verification across all tasks.

**Tech Stack:** React + Vite, Tailwind CSS, lucide-react icons, react-hot-toast. Brand tokens in `tailwind.config.js` — use `brand-primary` (#068562), `brand-accent` (#C9962A), `forest-*`, `surface-*`, `ink-*` throughout.

---

## Pre-flight

- [ ] **Start dev server**

```bash
cd sahlearn-web && npm run dev
```

Open http://localhost:5173 and log into both `/admin` and `/student`. Keep browser open throughout.

---

## Task 1: StatusBadge shared component

**Files:**
- Create: `sahlearn-web/src/components/common/StatusBadge.jsx`

- [ ] **Create the component**

```jsx
// sahlearn-web/src/components/common/StatusBadge.jsx
export default function StatusBadge({ status }) {
  const map = {
    active:     'bg-green-50 text-green-700 border border-green-200',
    published:  'bg-green-50 text-green-700 border border-green-200',
    enrolled:   'bg-green-50 text-green-700 border border-green-200',
    replied:    'bg-green-50 text-green-700 border border-green-200',
    paid:       'bg-green-50 text-green-700 border border-green-200',
    graded:     'bg-green-50 text-green-700 border border-green-200',
    present:    'bg-green-50 text-green-700 border border-green-200',
    pending:    'bg-amber-50 text-amber-700 border border-amber-200',
    draft:      'bg-amber-50 text-amber-700 border border-amber-200',
    contacted:  'bg-blue-50 text-blue-700 border border-blue-200',
    new:        'bg-blue-50 text-blue-700 border border-blue-200',
    read:       'bg-surface-100 text-ink-500 border border-surface-300',
    archived:   'bg-surface-100 text-ink-400 border border-surface-300',
    inactive:   'bg-red-50 text-red-700 border border-red-200',
    rejected:   'bg-red-50 text-red-700 border border-red-200',
    failed:     'bg-red-50 text-red-700 border border-red-200',
    absent:     'bg-red-50 text-red-700 border border-red-200',
    overdue:    'bg-red-50 text-red-700 border border-red-200',
    late:       'bg-orange-50 text-orange-700 border border-orange-200',
    excused:    'bg-purple-50 text-purple-700 border border-purple-200',
    submitted:  'bg-blue-50 text-blue-700 border border-blue-200',
    reviewed:   'bg-purple-50 text-purple-700 border border-purple-200',
  };
  const cls = map[status?.toLowerCase()] ?? 'bg-surface-100 text-ink-500 border border-surface-300';
  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${cls}`}>
      {status}
    </span>
  );
}
```

- [ ] **Commit**

```bash
git add sahlearn-web/src/components/common/StatusBadge.jsx
git commit -m "feat(ui): add shared StatusBadge component"
```

---

## Task 2: StudentLayout — full replacement

**Files:**
- Modify: `sahlearn-web/src/components/layout/StudentLayout.jsx`

- [ ] **Replace the entire file**

```jsx
// sahlearn-web/src/components/layout/StudentLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import {
  LayoutDashboard, BookOpen, User, LogOut, Sprout,
  MessageCircle, ClipboardList, ClipboardCheck,
  BarChart2, CalendarCheck, Megaphone, Bell,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/courses',   label: 'My Courses',  icon: BookOpen },
  { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/student/exams',     label: 'Exams',       icon: ClipboardCheck },
  { to: '/student/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/student/attendance', label: 'Attendance',  icon: CalendarCheck },
  { to: '/student/progress',  label: 'My Progress', icon: BarChart2 },
  { to: '/student/messages',  label: 'Messages',    icon: MessageCircle },
  { to: '/student/profile',   label: 'Profile',     icon: User },
];

const BOTTOM_TABS = [
  { to: '/student/dashboard',   label: 'Home',     icon: LayoutDashboard, end: true },
  { to: '/student/courses',     label: 'Courses',  icon: BookOpen },
  { to: '/student/assignments', label: 'Tasks',    icon: ClipboardList },
  { to: '/student/messages',    label: 'Messages', icon: MessageCircle },
  { to: '/student/profile',     label: 'Profile',  icon: User },
];

function SideNavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all duration-150 border-r-2 ${
          isActive
            ? 'bg-surface-100 border-brand-primary text-brand-primary'
            : 'border-transparent text-ink-500 hover:text-ink-900 hover:bg-surface-100'
        }`
      }
    >
      <Icon size={16} className="flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

function BottomTabBar() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden flex items-stretch bg-white border-t border-surface-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {BOTTOM_TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5">
          {({ isActive }) => (
            <>
              <span
                className="flex items-center justify-center w-9 h-7 rounded-xl transition-all duration-200"
                style={isActive ? { background: 'rgba(6,133,98,0.1)' } : {}}
              >
                <Icon size={17} style={{ color: isActive ? '#068562' : '#7A9890' }} />
              </span>
              <span className="text-[10px] font-semibold" style={{ color: isActive ? '#068562' : '#7A9890' }}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default function StudentLayout() {
  const { student, logoutStudent } = useStudentAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logoutStudent(); navigate('/student/login'); };

  const initials = student?.fullName
    ? student.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ST';

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30"
        style={{ background: 'linear-gradient(90deg, #013F4A 0%, #068562 100%)', height: '52px' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Sprout size={15} className="text-white" />
          </div>
          <span className="text-base font-display text-white leading-none">sahlearn</span>
          <span className="hidden sm:block text-[9px] font-semibold tracking-widest uppercase" style={{ color: '#71B280' }}>
            Student
          </span>
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/student/messages"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
            aria-label="Messages"
          >
            <Bell size={15} className="text-white" />
          </NavLink>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #C9962A, #E8B84B)', color: '#011F28' }}
          >
            {student?.avatar?.url
              ? <img src={student.avatar.url} alt={student.fullName} className="w-full h-full rounded-full object-cover" />
              : initials
            }
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-60 bg-white border-r border-surface-200 flex-shrink-0">
          <nav className="flex-1 py-3">
            {NAV_ITEMS.map((item) => <SideNavItem key={item.to} {...item} />)}
          </nav>
          <div className="border-t border-surface-200 p-3">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-1">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background: 'rgba(6,133,98,0.1)', color: '#068562' }}>
                {student?.avatar?.url
                  ? <img src={student.avatar.url} alt={student.fullName} className="w-full h-full rounded-full object-cover" />
                  : initials
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink-900 truncate">{student?.fullName}</p>
                <p className="text-[11px] text-ink-400 truncate">{student?.studentId}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-xl text-sm text-ink-500 hover:text-ink-900 hover:bg-surface-100 transition-all"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#F5FAF8' }}>
          <main className="p-4 sm:p-6 md:p-8 pb-24 lg:pb-8">
            <Outlet />
          </main>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
}
```

- [ ] **Verify in browser**
  - Navigate to `/student/dashboard` — top green bar should appear with logo, bell, gold avatar
  - On desktop: white sidebar visible with green active indicator on Dashboard
  - Resize to mobile (< 1024px): sidebar disappears, top bar stays, white bottom tab bar appears with 5 tabs
  - Sign out button in sidebar works

- [ ] **Commit**

```bash
git add sahlearn-web/src/components/layout/StudentLayout.jsx
git commit -m "feat(student): replace layout with top bar + white sidebar + mobile tab bar"
```

---

## Task 3: Admin Dashboard — targeted visual upgrades

**Files:**
- Modify: `sahlearn-web/src/pages/admin/Dashboard.jsx`

The greeting banner needs two mini-stat chips on the right (total students + total pending actions). The content health panel needs an Attendance Sessions row.

- [ ] **Replace the greeting banner section** (lines 62–107, the `<div className="relative rounded-2xl overflow-hidden...">` block) with:

```jsx
{/* ── Greeting banner ── */}
<div
  className="relative rounded-2xl overflow-hidden p-5 sm:p-6"
  style={{ background: 'linear-gradient(135deg, #013F4A 0%, #011F28 100%)' }}
>
  <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-10"
    style={{ background: 'radial-gradient(circle, #71B280, transparent)' }} />
  <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full opacity-5"
    style={{ background: 'radial-gradient(circle, #C9962A, transparent)' }} />

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
```

- [ ] **Add Attendance Sessions row to content health panel** — inside the `[stats && [...].map(...)` array in the Content health panel, add a third object after the `Blog posts` entry:

```jsx
{
  label: 'Attendance sessions',
  published: stats.attendance?.sessions ?? 0,
  draft: 0,
  total: stats.attendance?.sessions ?? 0,
  color: '#C9962A',
  link: '/admin/attendance',
},
```

Note: `stats.attendance` may be undefined if the admin stats endpoint doesn't include it. Wrap the value safely: `stats.attendance?.sessions ?? 0`. The bar will show 100% if total === published — that's correct (sessions are always "published").

- [ ] **Verify in browser**
  - Admin dashboard shows two mini-stat chips inside the greeting banner (right side on desktop)
  - Content health panel shows 3 bars: Courses, Blog posts, Attendance sessions

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/admin/Dashboard.jsx
git commit -m "feat(admin): add mini-stats to greeting banner and attendance row to health panel"
```

---

## Task 4: Student Dashboard — full replacement

**Files:**
- Modify: `sahlearn-web/src/pages/student/Dashboard.jsx`

- [ ] **Replace the entire file**

```jsx
// sahlearn-web/src/pages/student/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { getMe, getStats } from '../../services/student.service';
import { getAssignments } from '../../services/studentAssignments.service';
import { getExams } from '../../services/studentExams.service';
import { BookOpen, ClipboardList, FileText, TrendingUp, ChevronRight, Clock, AlertCircle } from 'lucide-react';

export default function StudentDashboard() {
  const { student, setStudent } = useStudentAuth();
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(!student?.enrolledCourses);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [me, s, assignRes, examRes] = await Promise.all([
          student?.enrolledCourses ? Promise.resolve(student) : getMe(),
          getStats(),
          getAssignments({ limit: 20 }).catch(() => ({ data: [] })),
          getExams().catch(() => ({ data: [] })),
        ]);
        setStudent(me);
        setStats(s);

        // Build upcoming list: pending assignments + pending exams, sorted by due date
        const now = new Date();
        const pendingAssignments = (assignRes.data || [])
          .filter((a) => !a.mySubmission && a.dueDate && new Date(a.dueDate) > now)
          .map((a) => ({
            id: a._id,
            title: a.title,
            course: a.course?.title || '',
            dueDate: new Date(a.dueDate),
            type: 'assignment',
            link: `/student/assignments/${a._id}`,
          }));

        const pendingExams = (examRes.data || [])
          .filter((e) => !e.myAttempt && e.dueDate && new Date(e.dueDate) > now)
          .map((e) => ({
            id: e._id || e.id,
            title: e.title,
            course: e.course?.title || '',
            dueDate: new Date(e.dueDate),
            type: 'exam',
            link: `/student/exams`,
          }));

        const all = [...pendingAssignments, ...pendingExams].sort((a, b) => a.dueDate - b.dueDate).slice(0, 5);
        setUpcoming(all);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const courseCount = student?.enrolledCourses?.length || 0;
  const pendingCount = stats?.assignments?.pending ?? 0;

  const daysUntil = (date) => {
    const diff = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `In ${diff} days`;
  };

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Welcome banner */}
      <div
        className="relative rounded-2xl overflow-hidden p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, #068562 0%, #013F4A 100%)' }}
      >
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4), transparent)' }}
        />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#71B280' }}>
            {greeting}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl text-white leading-tight">
            Welcome back, {student?.fullName?.split(' ')?.[0] ?? 'there'}
          </h1>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Student ID: {student?.studentId}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(113,178,128,0.2)', color: '#71B280', border: '1px solid rgba(113,178,128,0.3)' }}
            >
              {courseCount} Course{courseCount !== 1 ? 's' : ''} enrolled
            </span>
            {pendingCount > 0 && (
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(201,150,42,0.2)', color: '#E8B84B', border: '1px solid rgba(201,150,42,0.3)' }}
              >
                {pendingCount} assignment{pendingCount !== 1 ? 's' : ''} pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Link to="/student/courses" className="bg-white rounded-2xl border border-surface-200 p-4 sm:p-5 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,133,98,0.1)' }}>
              <BookOpen size={18} className="text-brand-primary" />
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(6,133,98,0.08)', color: '#068562' }}>
              Active
            </span>
          </div>
          <p className="text-3xl font-display text-brand-primary leading-none mb-1">{courseCount}</p>
          <p className="text-xs font-medium text-ink-500">Enrolled Courses</p>
        </Link>

        <Link to="/student/assignments" className="bg-white rounded-2xl border border-surface-200 p-4 sm:p-5 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
              <ClipboardList size={18} className="text-blue-600" />
            </div>
            {pendingCount > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                {pendingCount} pending
              </span>
            )}
          </div>
          <p className="text-3xl font-display text-ink-900 leading-none mb-1">
            {stats ? `${stats.assignments.submitted} / ${stats.assignments.total}` : '—'}
          </p>
          <p className="text-xs font-medium text-ink-500">Assignments Submitted</p>
        </Link>

        <Link to="/student/exams" className="bg-white rounded-2xl border border-surface-200 p-4 sm:p-5 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50">
              <FileText size={18} className="text-purple-600" />
            </div>
            {stats?.exams?.avgScore != null && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 flex items-center gap-0.5">
                <TrendingUp size={9} /> Avg {stats.exams.avgScore}%
              </span>
            )}
          </div>
          <p className="text-3xl font-display text-ink-900 leading-none mb-1">
            {stats ? stats.exams.taken : '—'}
          </p>
          <p className="text-xs font-medium text-ink-500">Exams Taken</p>
        </Link>
      </div>

      {/* Two-column panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

        {/* Upcoming */}
        <div className="bg-white rounded-2xl border border-surface-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-ink-900">Upcoming</p>
            <Link to="/student/assignments" className="text-xs text-brand-primary hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={11} />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-xs text-ink-400 py-4 text-center">Nothing due soon.</p>
          ) : (
            <div className="space-y-0">
              {upcoming.map((item) => (
                <Link key={item.id} to={item.link} className="flex items-start gap-3 py-3 border-b border-surface-100 last:border-0 hover:bg-surface-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: item.type === 'exam' ? '#8b5cf6' : '#f97316' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-800 truncate">{item.title}</p>
                    <p className="text-xs text-ink-400 mt-0.5">{item.course}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-orange-50 text-orange-600">
                    {daysUntil(item.dueDate)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* My Courses */}
        <div className="bg-white rounded-2xl border border-surface-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-ink-900">My Courses</p>
            <Link to="/student/courses" className="text-xs text-brand-primary hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={11} />
            </Link>
          </div>
          {courseCount === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-ink-400">No courses enrolled yet.</p>
              <Link to="/courses" className="text-xs text-brand-primary hover:underline mt-1 block">Browse courses →</Link>
            </div>
          ) : (
            <div className="space-y-0">
              {student.enrolledCourses.slice(0, 4).map((ec) => (
                <div key={ec.enrollmentId || ec.course?._id} className="flex items-center gap-3 py-3 border-b border-surface-100 last:border-0">
                  {ec.course?.coverImage?.url ? (
                    <img src={ec.course.coverImage.url} alt={ec.course.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #068562, #71B280)' }} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 truncate">{ec.course?.title || 'Course'}</p>
                    <p className="text-xs text-ink-400">{ec.course?.category}</p>
                    <div className="h-1 bg-surface-200 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-1 rounded-full" style={{ width: '0%', background: 'linear-gradient(90deg, #068562, #71B280)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Verify in browser** — `/student/dashboard` shows:
  - Green gradient welcome banner with name, student ID, chip badges
  - 3 stat cards (Courses, Assignments, Exams) with colored icon backgrounds
  - Upcoming panel with orange/purple dots per item type
  - My Courses panel with gradient thumbnails and progress bars

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/student/Dashboard.jsx
git commit -m "feat(student): redesign dashboard with welcome banner, stat cards, upcoming panel"
```

---

## Task 5: Admin Students page — Pattern A (table)

**Files:**
- Modify: `sahlearn-web/src/pages/admin/Students.jsx`

- [ ] **Replace the entire file** (preserve all state, handlers, and service calls; only update JSX structure)

```jsx
// sahlearn-web/src/pages/admin/Students.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getStudents } from '../../services/adminStudents.service';
import { Search, ChevronRight, UserCheck, UserX } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

const GRAD = ['linear-gradient(135deg,#068562,#71B280)', 'linear-gradient(135deg,#C9962A,#E8B84B)', 'linear-gradient(135deg,#8b5cf6,#6366f1)', 'linear-gradient(135deg,#3b82f6,#60a5fa)', 'linear-gradient(135deg,#f97316,#fb923c)'];
const avatarGrad = (name) => GRAD[(name?.charCodeAt(0) ?? 0) % GRAD.length];

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStudents({ page, search });
      setStudents(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Students</h1>
          <p className="text-xs text-ink-400 mt-0.5">{meta.total} total student{meta.total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search name, email, ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-ink-300/20 overflow-hidden shadow-card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-ink-400">No students found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-left">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Student</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden sm:table-cell">ID</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden md:table-cell">Temp Password</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden lg:table-cell">Courses</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden lg:table-cell">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {students.map((s) => {
                const initials = s.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                return (
                  <tr key={s.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-white"
                          style={{ background: avatarGrad(s.fullName) }}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-ink-900">{s.fullName}</p>
                          <p className="text-xs text-ink-400">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-500 hidden sm:table-cell font-mono text-xs">{s.studentId}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      {s.tempPassword
                        ? <span className="font-mono text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">{s.tempPassword}</span>
                        : <span className="text-xs text-ink-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-ink-600 hidden lg:table-cell">{s.enrolledCourses?.length || 0}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <StatusBadge status={s.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/admin/students/${s.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: 'rgba(6,133,98,0.08)', color: '#068562', border: '1px solid rgba(6,133,98,0.15)' }}
                      >
                        View <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 bg-surface-50 border-t border-surface-200">
            <p className="text-xs text-ink-400">
              Showing {students.length} of {meta.total}
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium border border-surface-300 rounded-lg disabled:opacity-40 hover:bg-surface-100 transition bg-white text-ink-600"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition"
                  style={page === p
                    ? { background: '#068562', color: '#fff' }
                    : { background: '#fff', color: '#506860', border: '1px solid rgba(168,196,188,0.4)' }
                  }
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === meta.totalPages}
                className="px-3 py-1.5 text-xs font-medium border border-surface-300 rounded-lg disabled:opacity-40 hover:bg-surface-100 transition bg-white text-ink-600"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Verify** — `/admin/students` shows gradient avatar circles, styled table header, green "View" button, pagination with green active pill

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/admin/Students.jsx
git commit -m "feat(admin): apply Pattern A table design to Students page"
```

---

## Task 6: Admin Exams page — Pattern A (table)

**Files:**
- Modify: `sahlearn-web/src/pages/admin/Exams.jsx`

- [ ] **Replace the return JSX only** — keep all state (`exams`, `meta`, `page`, `loading`), `load` callback, and `handleDelete` unchanged. Replace the `return (...)` block with:

```jsx
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Exams</h1>
          <p className="text-xs text-ink-400 mt-0.5">{meta.total} total</p>
        </div>
        <Link
          to="/admin/exams/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #068562, #056B4E)' }}
        >
          <Plus size={15} /> New Exam
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-ink-300/20 overflow-hidden shadow-card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="py-16 text-center text-sm text-ink-400">No exams yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50 text-left">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Title</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden sm:table-cell">Course</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden md:table-cell">Due Date</th>
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400 hidden lg:table-cell">Attempts</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-ink-900">{exam.title}</td>
                  <td className="px-5 py-3.5 text-ink-500 hidden sm:table-cell">{exam.course?.title || '—'}</td>
                  <td className="px-5 py-3.5 text-ink-500 hidden md:table-cell">
                    {exam.dueDate ? new Date(exam.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-ink-600 hidden lg:table-cell">{exam.attemptCount ?? 0}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        to={`/admin/exams/${exam.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                        style={{ background: 'rgba(6,133,98,0.08)', color: '#068562', border: '1px solid rgba(6,133,98,0.15)' }}
                      >
                        <ChevronRight size={12} /> Review
                      </Link>
                      <Link
                        to={`/admin/exams/${exam.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-surface-100 text-ink-600 border border-surface-300 hover:bg-surface-200 transition"
                      >
                        <Pencil size={12} /> Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(exam)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 bg-surface-50 border-t border-surface-200">
            <p className="text-xs text-ink-400">Page {page} of {meta.totalPages}</p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-xs font-medium border border-surface-300 rounded-lg disabled:opacity-40 hover:bg-surface-100 bg-white text-ink-600">← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === meta.totalPages} className="px-3 py-1.5 text-xs font-medium border border-surface-300 rounded-lg disabled:opacity-40 hover:bg-surface-100 bg-white text-ink-600">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
```

Also add `import StatusBadge from '../../components/common/StatusBadge';` at the top (even if unused here, for consistency).

- [ ] **Verify** — `/admin/exams` has styled header, tinted row action buttons

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/admin/Exams.jsx
git commit -m "feat(admin): apply Pattern A table design to Exams page"
```

---

## Task 7: Admin Assignments page — Pattern A (table)

**Files:**
- Modify: `sahlearn-web/src/pages/admin/Assignments.jsx`

- [ ] **Read the current file first** to understand existing state and service imports, then apply the same pattern as Task 6:
  - Page header: title `Assignments` + count + `+ New Assignment` button linking to `/admin/assignments/new`
  - Table columns: Title, Course, Due Date, Submissions, Actions (Review + Edit + Delete)
  - Preserve all existing state, `load`, `handleDelete` logic unchanged
  - Apply the same table wrapper, `bg-surface-50` thead, `divide-y divide-surface-100` tbody, tinted action buttons, and pagination footer

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/admin/Assignments.jsx
git commit -m "feat(admin): apply Pattern A table design to Assignments page"
```

---

## Task 8: Admin Messages page — pattern A shell update

**Files:**
- Modify: `sahlearn-web/src/pages/admin/Messages.jsx`

The Messages page has complex modal + status-tab logic. Preserve all business logic. Only update the outer structure and table header styling.

- [ ] **Update the outer wrapper and heading** — find the outermost `<div className="space-y-...">` and update:

```jsx
// Replace the top heading section (before the tabs) with:
<div className="space-y-5">
  <div>
    <h1 className="text-2xl font-display text-ink-900">Messages</h1>
    <p className="text-xs text-ink-400 mt-0.5">{meta.total} total</p>
  </div>

  {/* Status filter chips — keep existing tab logic, just restyle */}
  <div className="flex gap-2 flex-wrap">
    {STATUS_TABS.map((tab) => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all"
        style={activeTab === tab
          ? { background: '#068562', color: '#fff' }
          : { background: '#fff', color: '#506860', border: '1px solid rgba(168,196,188,0.4)' }
        }
      >
        {tab}
      </button>
    ))}
  </div>
```

- [ ] **Update the table thead** — change from plain `<th className="px-4 py-3 font-medium text-ink-500">` to:

```jsx
<th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">
```

Apply to all `<th>` elements in the table header row.

- [ ] **Update the table wrapper** — change `className="bg-white rounded-2xl border border-surface-200 overflow-hidden"` to `className="bg-white rounded-2xl border border-ink-300/20 overflow-hidden shadow-card"`.

- [ ] **Verify** — `/admin/messages` shows green active tab chip, styled table header. Clicking a message still opens the modal.

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/admin/Messages.jsx
git commit -m "feat(admin): apply Pattern A shell to Messages page"
```

---

## Task 9: Admin Enrollments page — pattern A shell update

**Files:**
- Modify: `sahlearn-web/src/pages/admin/Enrollments.jsx`

Same approach as Task 8 — preserve all modal + confirm + upload logic. Only update outer structure.

- [ ] **Update page heading** — add `<h1 className="text-2xl font-display text-ink-900">Enrollments</h1>` and count `<p className="text-xs text-ink-400 mt-0.5">{meta.total} total</p>` before the status filter tabs.

- [ ] **Restyle status filter tabs** — same green active pill pattern as Task 8 (iterate `STATUS_TABS`, active = `background: '#068562', color: '#fff'`).

- [ ] **Update table wrapper and thead** — `shadow-card`, `border-ink-300/20`, thead `bg-surface-50` with `text-[10px] font-semibold uppercase tracking-widest text-ink-400`.

- [ ] **Verify** — `/admin/enrollments` shows styled header and tabs, modals still work.

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/admin/Enrollments.jsx
git commit -m "feat(admin): apply Pattern A shell to Enrollments page"
```

---

## Task 10: Admin Attendance, Announcements, Team — Pattern A shell

**Files:**
- Modify: `sahlearn-web/src/pages/admin/Attendance.jsx`
- Modify: `sahlearn-web/src/pages/admin/Announcements.jsx`
- Modify: `sahlearn-web/src/pages/admin/TeamMembers.jsx`

Apply the same shell pattern to all three — no business logic changes.

- [ ] **Attendance.jsx** — Add page header (`Attendance`, count). Update any table/list wrapper to `shadow-card border-ink-300/20`. Style filter chips green-active.

- [ ] **Announcements.jsx** — Add page header (`Announcements`, count). The existing inline form panel stays as-is. Style the list of announcements: each card stays `bg-white rounded-2xl border border-surface-200` (already correct). Add `+ New Announcement` button at top right that triggers the existing `setShowForm(true)`.

- [ ] **TeamMembers.jsx** — Add page header (`Team Members`, count) with `+ Add Member` button that calls `setShowCreate(true)`. Update table wrapper to `shadow-card`. Thead gets `bg-surface-50 text-[10px] font-semibold uppercase tracking-widest text-ink-400`. Each row: add initials avatar circle (same `avatarGrad` helper as Task 5 — copy it into this file).

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/admin/Attendance.jsx sahlearn-web/src/pages/admin/Announcements.jsx sahlearn-web/src/pages/admin/TeamMembers.jsx
git commit -m "feat(admin): apply Pattern A shell to Attendance, Announcements, TeamMembers"
```

---

## Task 11: Admin Courses page — Pattern A (card grid)

**Files:**
- Modify: `sahlearn-web/src/pages/admin/Courses.jsx`

- [ ] **Read the current file** to understand state/service imports, then replace the return JSX:

```jsx
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Courses</h1>
          <p className="text-xs text-ink-400 mt-0.5">{/* total count from meta or courses.length */} courses</p>
        </div>
        <Link
          to="/admin/courses/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl text-white transition hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #068562, #056B4E)' }}
        >
          <Plus size={15} /> New Course
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 py-16 text-center text-sm text-ink-400">
          No courses yet. <Link to="/admin/courses/new" className="text-brand-primary hover:underline">Create one</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl border border-ink-300/20 overflow-hidden shadow-card hover:shadow-card-hover transition-shadow group">
              {/* Cover */}
              <div className="relative h-36">
                {course.coverImage?.url ? (
                  <img src={course.coverImage.url} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #068562, #71B280)' }} />
                )}
                <div className="absolute top-2.5 left-2.5">
                  <StatusBadge status={course.status || (course.published ? 'published' : 'draft')} />
                </div>
              </div>
              {/* Body */}
              <div className="p-4">
                <h3 className="font-semibold text-ink-900 leading-snug mb-1 truncate">{course.title}</h3>
                <p className="text-xs text-ink-400 mb-3">{course.category} · {course.enrollmentCount ?? 0} students</p>
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to={`/admin/courses/${course.id}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(6,133,98,0.08)', color: '#068562', border: '1px solid rgba(6,133,98,0.15)' }}
                  >
                    Edit
                  </Link>
                  {/* Preserve any existing delete button or modal trigger */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
```

Add `import StatusBadge from '../../components/common/StatusBadge';` at the top.

- [ ] **Verify** — `/admin/courses` shows card grid with cover images, gradient fallback, StatusBadge overlay.

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/admin/Courses.jsx
git commit -m "feat(admin): apply Pattern A card grid to Courses page"
```

---

## Task 12: Admin Posts page — Pattern A (card grid)

**Files:**
- Modify: `sahlearn-web/src/pages/admin/Posts.jsx`

- [ ] **Read the current file**, then apply the same card grid as Task 11. Differences:
  - Title: `Blog Posts`
  - Link: `/admin/posts/new` with label `+ New Post`
  - Fields per card: `post.title`, `post.category`, `post.published` (StatusBadge: `published` or `draft`), `post.coverImage?.url`
  - Edit link: `/admin/posts/${post.id}/edit`

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/admin/Posts.jsx
git commit -m "feat(admin): apply Pattern A card grid to Posts page"
```

---

## Task 13: Admin StudentDetail — Pattern B (detail)

**Files:**
- Modify: `sahlearn-web/src/pages/admin/StudentDetail.jsx`

Pattern B adds: breadcrumb → header card (large avatar + name + chips + action buttons) → tab bar → content. All existing tabs/sections/modals/handlers are preserved.

- [ ] **Read the full current file** (it's long — read all of it), then replace the JSX from line 74 onwards (the `return (` block). Keep all state, handlers, and imported functions. The new JSX structure:

```jsx
  return (
    <div className="max-w-4xl space-y-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-ink-400">
        <Link to="/admin/students" className="hover:text-ink-900 transition">Students</Link>
        <span>›</span>
        <span className="font-semibold" style={{ color: '#068562' }}>{student.fullName}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-ink-300/20 shadow-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #068562, #71B280)' }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display text-ink-900">{student.fullName}</h1>
          <p className="text-xs text-ink-400 mt-0.5">{student.studentId} · {student.email}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge status={student.isActive ? 'active' : 'inactive'} />
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {student.enrolledCourses?.length || 0} Course{(student.enrolledCourses?.length || 0) !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        {/* Action buttons — preserve existing handlers */}
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <button
            onClick={() => navigate(`/admin/student-messages?student=${student.id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-surface-100 text-ink-700 border border-surface-300 hover:bg-surface-200 transition"
          >
            <Mail size={13} /> Message
          </button>
          <button
            onClick={handleResetPassword}
            disabled={resetting}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-surface-100 text-ink-700 border border-surface-300 hover:bg-surface-200 transition disabled:opacity-40"
          >
            <RefreshCw size={13} className={resetting ? 'animate-spin' : ''} />
            {resetting ? 'Sending…' : 'Reset PW'}
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={toggling}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition disabled:opacity-40 ${
              student.isActive
                ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
            }`}
          >
            {student.isActive ? <><UserX size={13} /> Deactivate</> : <><UserCheck size={13} /> Activate</>}
          </button>
        </div>
      </div>

      {/* ── Preserve all existing detail panels below unchanged ── */}
      {/* Everything from line 75 of the current file onwards (the original ScoreBars,
          progress panels, assignment list, attendance records) goes here verbatim.
          Do NOT remove or rewrite any of those sections — only the breadcrumb and
          header card above are new. Scroll to line 75 in the current file and
          paste all remaining JSX here, then close the outer div. */}
    </div>
  );
```

Also add `import StatusBadge from '../../components/common/StatusBadge';` at the top.

- [ ] **Verify** — `/admin/students/:id` shows breadcrumb, large avatar card with action buttons, then existing detail panels below.

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/admin/StudentDetail.jsx
git commit -m "feat(admin): apply Pattern B header card and breadcrumb to StudentDetail"
```

---

## Task 14: Admin ExamDetail and AssignmentDetail — Pattern B

**Files:**
- Modify: `sahlearn-web/src/pages/admin/ExamDetail.jsx`
- Modify: `sahlearn-web/src/pages/admin/AssignmentDetail.jsx`

- [ ] **ExamDetail.jsx** — Read the current file. Add breadcrumb `Exams › {exam.title}` and a header card (title as name, StatusBadge for published/draft status, action buttons for Edit/Delete if they exist). Preserve all attempt review panels.

- [ ] **AssignmentDetail.jsx** — Same: breadcrumb `Assignments › {assignment.title}`, header card with title + course + due date chip + StatusBadge. Preserve all submission review logic.

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/admin/ExamDetail.jsx sahlearn-web/src/pages/admin/AssignmentDetail.jsx
git commit -m "feat(admin): apply Pattern B header card to ExamDetail and AssignmentDetail"
```

---

## Task 15: Admin AttendanceSession — Pattern B

**Files:**
- Modify: `sahlearn-web/src/pages/admin/AttendanceSession.jsx`

- [ ] **Read the current file**, add breadcrumb `Attendance › {session title/date}` and header card with session date, course name, StatusBadge. Preserve all student-marking logic.

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/admin/AttendanceSession.jsx
git commit -m "feat(admin): apply Pattern B header to AttendanceSession"
```

---

## Task 16: Student MyCourses — Pattern D

**Files:**
- Modify: `sahlearn-web/src/pages/student/MyCourses.jsx`

- [ ] **Replace the entire file** — keep all state and `getMe` logic:

```jsx
// sahlearn-web/src/pages/student/MyCourses.jsx
import { useEffect, useState } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { getMe } from '../../services/student.service';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function MyCourses() {
  const { student, setStudent } = useStudentAuth();
  const [loading, setLoading] = useState(!student?.enrolledCourses);

  useEffect(() => {
    if (!student?.enrolledCourses) {
      getMe().then((data) => { setStudent(data); setLoading(false); }).catch(() => setLoading(false));
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const courses = student?.enrolledCourses || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display text-ink-900">My Courses</h1>
        <p className="text-xs text-ink-400 mt-0.5">{courses.length} enrolled course{courses.length !== 1 ? 's' : ''}</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <BookOpen size={22} className="text-ink-300" />
          </div>
          <p className="font-semibold text-ink-700">No courses yet</p>
          <p className="text-sm text-ink-400 mt-1">Enroll to get started.</p>
          <Link to="/courses" className="mt-4 inline-block text-sm text-brand-primary hover:underline">Browse courses →</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((ec) => (
            <div key={ec.enrollmentId || ec.course?._id} className="bg-white rounded-2xl border border-surface-200 overflow-hidden hover:shadow-card-hover transition-shadow">
              {ec.course?.coverImage?.url ? (
                <img src={ec.course.coverImage.url} alt={ec.course.title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36" style={{ background: 'linear-gradient(135deg, #068562, #71B280)' }} />
              )}
              <div className="p-4">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(6,133,98,0.1)', color: '#068562' }}>
                  {ec.course?.category || 'Course'}
                </span>
                <h3 className="font-semibold text-ink-900 mt-2 leading-snug">{ec.course?.title || 'Untitled Course'}</h3>
                <p className="text-xs text-ink-400 mt-1">
                  Enrolled {new Date(ec.enrolledAt).toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-ink-400 mb-1">
                    <span>Progress</span><span>0%</span>
                  </div>
                  <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                    <div className="h-1.5 rounded-full" style={{ width: '0%', background: 'linear-gradient(90deg, #068562, #71B280)' }} />
                  </div>
                </div>
                {ec.course?.slug && (
                  <Link to={`/courses/${ec.course.slug}`} className="mt-3 block text-xs text-brand-primary hover:underline font-medium">
                    View course details →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/student/MyCourses.jsx
git commit -m "feat(student): apply Pattern D card grid to MyCourses page"
```

---

## Task 17: Student Assignments — Pattern D (card grid)

**Files:**
- Modify: `sahlearn-web/src/pages/student/Assignments.jsx`

- [ ] **Replace the return JSX** — keep all state, service calls, and the existing `StatusBadge` function. Replace the returned JSX with:

```jsx
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Assignments</h1>
        <p className="text-xs text-ink-400 mt-0.5">{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <ClipboardList size={22} className="text-ink-300" />
          </div>
          <p className="font-semibold text-ink-700">No assignments yet</p>
          <p className="text-sm text-ink-400 mt-1">Check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assignments.map((a) => {
            const overdue = a.dueDate && !a.mySubmission && new Date(a.dueDate) < new Date();
            return (
              <Link
                key={a._id}
                to={`/student/assignments/${a._id}`}
                className="bg-white rounded-2xl border border-surface-200 p-4 hover:shadow-card-hover transition-all duration-200 block"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-ink-900 leading-snug">{a.title}</h3>
                  <StatusBadge submission={a.mySubmission} dueDate={a.dueDate} />
                </div>
                <p className="text-xs text-ink-400 mb-3">{a.course?.title}</p>
                {a.description && (
                  <p className="text-xs text-ink-600 line-clamp-2 mb-3">{a.description}</p>
                )}
                <div>
                  <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: a.mySubmission ? '100%' : '0%',
                        background: a.mySubmission ? 'linear-gradient(90deg, #068562, #71B280)' : 'transparent',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-ink-400">
                      {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'No due date'}
                    </span>
                    {a.mySubmission?.grade && (
                      <span className="text-[10px] font-semibold text-green-600">Score: {a.mySubmission.grade}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
```

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/student/Assignments.jsx
git commit -m "feat(student): apply Pattern D card grid to Assignments page"
```

---

## Task 18: Student Exams — Pattern D (card grid)

**Files:**
- Modify: `sahlearn-web/src/pages/student/Exams.jsx`

- [ ] **Replace the return JSX** — keep all state, service calls, and the existing `StatusBadge` function:

```jsx
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Exams</h1>
        <p className="text-xs text-ink-400 mt-0.5">{exams.length} exam{exams.length !== 1 ? 's' : ''}</p>
      </div>

      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <ClipboardCheck size={22} className="text-ink-300" />
          </div>
          <p className="font-semibold text-ink-700">No exams available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <div key={exam._id || exam.id} className="bg-white rounded-2xl border border-surface-200 p-4 hover:shadow-card-hover transition-all duration-200">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-ink-900 leading-snug">{exam.title}</h3>
                <StatusBadge exam={exam} />
              </div>
              <p className="text-xs text-ink-400 mb-3">{exam.course?.title}</p>
              {exam.dueDate && (
                <p className="text-xs text-ink-500 mb-3">
                  Due {new Date(exam.dueDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
              <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden mb-3">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: exam.myAttempt ? '100%' : '0%',
                    background: exam.myAttempt?.status === 'reviewed' ? 'linear-gradient(90deg, #8b5cf6, #6366f1)' : 'linear-gradient(90deg, #068562, #71B280)',
                  }}
                />
              </div>
              {!exam.myAttempt && !(exam.dueDate && new Date(exam.dueDate) < new Date()) && (
                <Link
                  to={`/student/exams/${exam._id || exam.id}/take`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #068562, #056B4E)' }}
                >
                  Start Exam
                </Link>
              )}
              {exam.myAttempt && (
                <p className="text-xs font-semibold text-ink-600">
                  Score: {exam.myAttempt.score} / {exam.myAttempt.maxScore}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
```

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/student/Exams.jsx
git commit -m "feat(student): apply Pattern D card grid to Exams page"
```

---

## Task 19: Student Attendance — header + styled groups

**Files:**
- Modify: `sahlearn-web/src/pages/student/Attendance.jsx`

The attendance page already has a good `CourseGroup` component with circular rings. Preserve it. Only update the outer wrapper.

- [ ] **Update the return JSX** — keep all `CourseGroup`, `PctRing`, and `STATUS_DISPLAY` logic unchanged. Replace the outer `return (...)`:

```jsx
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Attendance</h1>
        <p className="text-xs text-ink-400 mt-0.5">Your attendance per course</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <CalendarCheck size={22} className="text-ink-300" />
          </div>
          <p className="font-semibold text-ink-700">No attendance records yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => <CourseGroup key={group.courseId || group.courseTitle} group={group} />)}
        </div>
      )}
    </div>
  );
```

Add `import { CalendarCheck } from 'lucide-react';` if not already imported.

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/student/Attendance.jsx
git commit -m "feat(student): update Attendance page header and empty state"
```

---

## Task 20: Student Progress — header + styled sections

**Files:**
- Modify: `sahlearn-web/src/pages/student/Progress.jsx`

Same approach — preserve all `CourseSection`, `ScoreBar` logic, update outer wrapper only.

- [ ] **Update the return JSX** — wrap existing content in:

```jsx
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display text-ink-900">My Progress</h1>
        <p className="text-xs text-ink-400 mt-0.5">Scores and results across all your courses</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <BarChart2 size={22} className="text-ink-300" />
          </div>
          <p className="font-semibold text-ink-700">No graded work yet</p>
          <p className="text-sm text-ink-400 mt-1">Complete assignments and exams to see your progress.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group, i) => <CourseSection key={i} group={group} />)}
        </div>
      )}
    </div>
  );
```

Add `import { BarChart2 } from 'lucide-react';` if not already imported.

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/student/Progress.jsx
git commit -m "feat(student): update Progress page header and empty state"
```

---

## Task 21: Student Announcements — header update

**Files:**
- Modify: `sahlearn-web/src/pages/student/Announcements.jsx`

- [ ] **Replace the return JSX** — keep all state and service logic. Preserve the attachment rendering logic:

```jsx
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Announcements</h1>
        <p className="text-xs text-ink-400 mt-0.5">Messages and documents from your instructor.</p>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <Megaphone size={22} className="text-ink-300" />
          </div>
          <p className="font-semibold text-ink-700">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-surface-200 p-5 hover:shadow-card transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(6,133,98,0.1)' }}>
                  <Megaphone size={16} className="text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-ink-900">{a.title}</h3>
                    {a.target === 'course' && a.course?.title && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(6,133,98,0.1)', color: '#068562' }}>
                        {a.course.title}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-400 mt-0.5">
                    {new Date(a.createdAt).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-sm text-ink-700 mt-2 whitespace-pre-wrap leading-relaxed">{a.body}</p>

                  {/* Preserve attachment rendering unchanged */}
                  {a.file?.url && (
                    <a
                      href={a.file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-surface-100 hover:bg-surface-200 rounded-xl text-sm text-ink-700 transition"
                    >
                      {a.file.mimeType?.includes('pdf') ? <FileText size={15} className="text-red-500" /> : <Paperclip size={15} className="text-ink-500" />}
                      <span className="truncate max-w-[200px]">{a.file.originalName || 'Download attachment'}</span>
                      {a.file.size && <span className="text-xs text-ink-400">{formatSize(a.file.size)}</span>}
                      <Download size={13} className="text-ink-400 flex-shrink-0" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
```

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/student/Announcements.jsx
git commit -m "feat(student): update Announcements page header and card styling"
```

---

## Task 22: Student Messages — header only

**Files:**
- Modify: `sahlearn-web/src/pages/student/Messages.jsx`

The messages page is a chat UI — preserve the entire message rendering, polling, send form, and file attachment logic. Only add a page title above the chat container.

- [ ] **Read the full current file**, then add a heading before the main chat container in the return statement:

```jsx
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Messages</h1>
        <p className="text-xs text-ink-400 mt-0.5">Your conversation with your instructor.</p>
      </div>

      {/* Paste the entire existing chat container here verbatim — starting from
          the loading spinner conditional, through the scrollable message list
          (with FileAttachment renders and bubble styles), the polling useEffect,
          and the send form with textarea + file picker at the bottom.
          Nothing inside that container changes. */}
    </div>
  );
```

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/student/Messages.jsx
git commit -m "feat(student): add page header to Messages"
```

---

## Task 23: Student Profile — section headings update

**Files:**
- Modify: `sahlearn-web/src/pages/student/Profile.jsx`

Profile has a complex form with avatar upload, password change, etc. Preserve all logic. Update visual wrapper only.

- [ ] **Read the full current file**, then wrap the return in a consistent outer `<div className="space-y-5 max-w-2xl">` with a page title `<h1 className="text-2xl font-display text-ink-900">My Profile</h1>`. Update any existing plain card wrappers from `className="bg-white rounded-2xl border border-surface-200 p-5"` to add `shadow-card` and `border-ink-300/20`. Preserve all form state, handlers, and input fields unchanged.

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/student/Profile.jsx
git commit -m "feat(student): update Profile page header and card shadows"
```

---

## Task 24: Student AssignmentDetail — header update

**Files:**
- Modify: `sahlearn-web/src/pages/student/AssignmentDetail.jsx`

- [ ] **Read the current file**, then add a breadcrumb (`Assignments › {assignment.title}`) and update the outer wrapper to `space-y-5 max-w-2xl`. Preserve all submission form, file upload, and grade display logic.

- [ ] **Commit**

```bash
git add sahlearn-web/src/pages/student/AssignmentDetail.jsx
git commit -m "feat(student): add breadcrumb to AssignmentDetail"
```

---

## Task 25: Final review pass

- [ ] **Visit every modified route** in the browser and verify:
  - Admin: `/admin`, `/admin/students`, `/admin/courses`, `/admin/posts`, `/admin/exams`, `/admin/assignments`, `/admin/messages`, `/admin/enrollments`, `/admin/attendance`, `/admin/announcements`, `/admin/team`, `/admin/students/:id`
  - Student: `/student/dashboard`, `/student/courses`, `/student/assignments`, `/student/exams`, `/student/attendance`, `/student/progress`, `/student/announcements`, `/student/messages`, `/student/profile`

- [ ] **Check mobile** (DevTools → responsive, 375px width):
  - Admin: bottom dark tab bar visible, sidebar hidden
  - Student: green top bar visible, white bottom tab bar visible with 5 tabs, sidebar hidden

- [ ] **Check no regressions**:
  - Admin login still works
  - Student login still works
  - Modals in Messages, Enrollments, Team still open correctly
  - Chat in student Messages still sends messages
  - Exam take flow (`/student/exams/:id/take`) — ExamTake.jsx was NOT modified, confirm it still loads

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete design overhaul — layout shells, dashboards, page patterns"
```
