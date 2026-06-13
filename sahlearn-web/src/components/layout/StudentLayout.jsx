// sahlearn-web/src/components/layout/StudentLayout.jsx
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import {
  LayoutDashboard, BookOpen, User, LogOut, Sprout,
  MessageCircle, ClipboardList, ClipboardCheck,
  BarChart2, CalendarCheck, Megaphone, Bell,
  MoreHorizontal, ArrowLeft, X,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/student/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/student/courses',      label: 'My Courses',   icon: BookOpen },
  { to: '/student/assignments',  label: 'Assignments',  icon: ClipboardList },
  { to: '/student/exams',        label: 'Exams',        icon: ClipboardCheck },
  { to: '/student/announcements',label: 'Announcements',icon: Megaphone },
  { to: '/student/attendance',   label: 'Attendance',   icon: CalendarCheck },
  { to: '/student/progress',     label: 'My Progress',  icon: BarChart2 },
  { to: '/student/messages',     label: 'Messages',     icon: MessageCircle },
  { to: '/student/profile',      label: 'Profile',      icon: User },
];

/* 4 core tabs + "More" tab */
const CORE_TABS = [
  { to: '/student/dashboard',   label: 'Home',     icon: LayoutDashboard, end: true },
  { to: '/student/courses',     label: 'Courses',  icon: BookOpen },
  { to: '/student/assignments', label: 'Tasks',    icon: ClipboardList },
  { to: '/student/messages',    label: 'Messages', icon: MessageCircle },
];

/* Items surfaced in the "More" sheet */
const MORE_ITEMS = [
  { to: '/student/exams',         label: 'Exams',        icon: ClipboardCheck },
  { to: '/student/announcements', label: 'Announcements',icon: Megaphone },
  { to: '/student/attendance',    label: 'Attendance',   icon: CalendarCheck },
  { to: '/student/progress',      label: 'My Progress',  icon: BarChart2 },
  { to: '/student/profile',       label: 'Profile',      icon: User },
];

/* Resolve the back-navigation target from the current path.
   Always navigates to the nearest list page, never relies on browser history. */
function getParentRoute(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 2) return null; // top-level page, no back needed
  // Walk up until we hit a 2-segment (list) route
  let up = segments.slice(0, -1);
  while (up.length > 2) up = up.slice(0, -1);
  return '/' + up.join('/');
}

/* ── Sidebar nav item (desktop) ── */
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

/* ── "More" bottom sheet — portaled to document.body to escape overflow-hidden ── */
function MoreSheet({ open, onClose, onLogout }) {
  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100]"
        style={{ background: 'rgba(1,31,40,0.55)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 inset-x-0 z-[101] rounded-t-2xl overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 -8px 32px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-surface-200">
          <p className="text-sm font-semibold text-ink-900">More</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-ink-400 hover:bg-surface-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="px-3 py-2">
          {MORE_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-surface-100 text-brand-primary'
                    : 'text-ink-600 hover:bg-surface-100'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} style={{ color: isActive ? '#068562' : '#7A9890' }} className="flex-shrink-0" />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4 pt-1 border-t border-surface-100">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>

        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </div>
    </>,
    document.body
  );
}

/* ── Bottom tab bar — portaled to document.body ── */
function BottomTabBar({ onMoreClick, moreActive }) {
  return createPortal(
    <nav
      className="fixed bottom-0 inset-x-0 z-50 flex items-stretch bg-white border-t border-surface-200 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {CORE_TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
        >
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

      {/* More tab */}
      <button
        type="button"
        onClick={onMoreClick}
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
      >
        <span
          className="flex items-center justify-center w-9 h-7 rounded-xl transition-all duration-200"
          style={moreActive ? { background: 'rgba(6,133,98,0.1)' } : {}}
        >
          <MoreHorizontal size={17} style={{ color: moreActive ? '#068562' : '#7A9890' }} />
        </span>
        <span className="text-[10px] font-semibold" style={{ color: moreActive ? '#068562' : '#7A9890' }}>
          More
        </span>
      </button>
    </nav>,
    document.body
  );
}

/* ── Root layout ── */
export default function StudentLayout() {
  const { student, logoutStudent } = useStudentAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => { logoutStudent(); navigate('/'); };

  const initials = student?.fullName
    ? student.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'ST';

  const parentRoute = getParentRoute(pathname);
  const isLeaf = parentRoute !== null;
  const moreActive = MORE_ITEMS.some(({ to }) => pathname === to || pathname.startsWith(to + '/'));

  return (
    <div className="flex flex-col h-screen overflow-hidden">

      {/* ── Top bar ── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30"
        style={{ background: 'linear-gradient(90deg, #013F4A 0%, #068562 100%)', height: '52px' }}
      >
        {/* Left */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Back arrow — mobile only, detail pages only */}
          {isLeaf && (
            <button
              type="button"
              onClick={() => navigate(parentRoute)}
              className="lg:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
              aria-label="Go back"
            >
              <ArrowLeft size={16} className="text-white" />
            </button>
          )}

          {/* Logo */}
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isLeaf ? 'hidden lg:flex' : 'flex'}`}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
          >
            <Sprout size={15} className="text-white" />
          </div>
          <span className={`text-base font-display text-white leading-none truncate ${isLeaf ? 'hidden lg:block' : ''}`}>
            sahlearn
          </span>
          <span className="hidden sm:block text-[9px] font-semibold tracking-widest uppercase flex-shrink-0" style={{ color: '#71B280' }}>
            Student
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <NavLink
            to="/student/messages"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' }}
            aria-label="Messages"
          >
            <Bell size={15} className="text-white" />
          </NavLink>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #C9962A, #E8B84B)', color: '#011F28' }}
          >
            {student?.avatar?.url
              ? <img src={student.avatar.url} alt={student.fullName} className="w-full h-full object-cover" />
              : initials
            }
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-60 bg-white border-r border-surface-200 flex-shrink-0">
          <nav className="flex-1 py-3">
            {NAV_ITEMS.map((item) => <SideNavItem key={item.to} {...item} />)}
          </nav>
          <div className="border-t border-surface-200 p-3">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl mb-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold overflow-hidden"
                style={{ background: 'rgba(6,133,98,0.1)', color: '#068562' }}
              >
                {student?.avatar?.url
                  ? <img src={student.avatar.url} alt={student.fullName} className="w-full h-full object-cover" />
                  : initials
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ink-900 truncate">{student?.fullName}</p>
                <p className="text-[11px] text-ink-400 truncate">{student?.studentId}</p>
              </div>
            </div>
            <button
              type="button"
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

      {/* Portaled outside overflow-hidden — safe on all mobile browsers */}
      <BottomTabBar onMoreClick={() => setMoreOpen(true)} moreActive={moreActive} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} onLogout={handleLogout} />
    </div>
  );
}
