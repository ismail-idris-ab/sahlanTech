import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, FileText,
  MessageSquare, Users, UserCog,
  LogOut, Sprout, Bell, GraduationCap, MessageCircle,
  ClipboardList, ClipboardCheck, CalendarCheck, Megaphone, Globe,
  MoreHorizontal, ArrowLeft, X,
} from 'lucide-react';
import api from '../../services/api';

/* ── Nav config ── */
const SIDEBAR_MAIN = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/posts', label: 'Blog', icon: FileText },
];
const SIDEBAR_MANAGE = [
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/enrollments', label: 'Enrollments', icon: Users },
  { to: '/admin/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/admin/exams', label: 'Exams', icon: ClipboardCheck },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/student-messages', label: 'Student Messages', icon: MessageCircle },
  { to: '/admin/team', label: 'Team', icon: UserCog },
  { to: '/admin/site-content', label: 'Site Content', icon: Globe },
];

/* Mobile: 4 core tabs + "More" */
const BOTTOM_TABS = [
  { to: '/admin', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
];

/* Everything not in the bottom bar lives in the "More" sheet */
const MORE_ITEMS = [
  { to: '/admin/posts', label: 'Blog', icon: FileText },
  { to: '/admin/enrollments', label: 'Enrollments', icon: Users },
  { to: '/admin/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/admin/exams', label: 'Exams', icon: ClipboardCheck },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/student-messages', label: 'Student Messages', icon: MessageCircle },
  { to: '/admin/team', label: 'Team', icon: UserCog },
  { to: '/admin/site-content', label: 'Site Content', icon: Globe },
];

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/courses': 'Courses',
  '/admin/posts': 'Blog Posts',
  '/admin/messages': 'Messages',
  '/admin/enrollments': 'Enrollments',
  '/admin/assignments': 'Assignments',
  '/admin/exams': 'Exams',
  '/admin/attendance': 'Attendance',
  '/admin/announcements': 'Announcements',
  '/admin/students': 'Students',
  '/admin/student-messages': 'Student Messages',
  '/admin/team': 'Team',
  '/admin/site-content': 'Site Content',
};

/* Resolve back-navigation target from current path (never relies on browser history) */
function getParentRoute(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 2) return null; // /admin or /admin/x → top-level, no back
  let up = segments.slice(0, -1);
  while (up.length > 2) up = up.slice(0, -1);
  return '/' + up.join('/');
}

/* ── Sidebar nav item ── */
function SideNavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
          isActive
            ? 'nav-active-glow text-forest-sage'
            : 'text-forest-muted hover:text-white hover:bg-white/5'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={17} className="flex-shrink-0" />
          <span>{label}</span>
          {isActive && (
            <span
              className="absolute right-3 w-1.5 h-1.5 rounded-full"
              style={{ background: '#71B280', boxShadow: '0 0 6px #71B280' }}
            />
          )}
        </>
      )}
    </NavLink>
  );
}

/* ── Desktop sidebar ── */
function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="relative z-10 px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #C9962A, #E8B84B)', boxShadow: '0 4px 12px rgba(201,150,42,0.4)' }}
          >
            <Sprout size={16} className="text-forest-950" />
          </div>
          <div>
            <span className="text-lg font-display text-white leading-none tracking-wide">sahlearn</span>
            <span className="block text-[10px] tracking-widest uppercase leading-none mt-0.5" style={{ color: '#71B280' }}>
              Admin Portal
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-5 mb-4 gold-divider" />

      {/* Nav groups */}
      <nav className="relative z-10 flex-1 px-3 overflow-y-auto space-y-5">
        <div>
          <p className="px-3.5 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(135,186,194,0.5)' }}>
            Menu
          </p>
          <div className="space-y-0.5">
            {SIDEBAR_MAIN.map((item) => <SideNavItem key={item.to} {...item} />)}
          </div>
        </div>
        <div>
          <p className="px-3.5 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(135,186,194,0.5)' }}>
            Manage
          </p>
          <div className="space-y-0.5">
            {SIDEBAR_MANAGE.map((item) => <SideNavItem key={item.to} {...item} />)}
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-5 mt-4 mb-4 gold-divider" />

      {/* User + logout */}
      <div className="relative z-10 px-3 pb-5">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #068562, #71B280)', color: '#011F28' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">{user?.name}</p>
            <p className="text-[11px] truncate leading-tight" style={{ color: '#87BAC2' }}>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-xl text-sm transition-all duration-150 hover:bg-white/5"
          style={{ color: '#87BAC2' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#87BAC2'}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  );
}

/* ── "More" bottom sheet — portaled to document.body ── */
function MoreSheet({ open, onClose, onLogout }) {
  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] lg:hidden"
        style={{ background: 'rgba(1,31,40,0.6)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 inset-x-0 z-[101] lg:hidden rounded-t-2xl overflow-hidden"
        style={{ background: '#013F4A', boxShadow: '0 -8px 32px rgba(0,0,0,0.35)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(201,150,42,0.2)' }}>
          <p className="text-sm font-semibold text-white">More</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-colors hover:bg-white/5"
            style={{ color: '#87BAC2' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav grid */}
        <nav className="grid grid-cols-3 gap-2 p-4">
          {MORE_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl text-center transition-all ${
                  isActive ? 'bg-white/10' : 'hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} style={{ color: isActive ? '#71B280' : '#87BAC2' }} />
                  <span className="text-[10px] font-medium leading-tight" style={{ color: isActive ? '#71B280' : '#87BAC2' }}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4 pt-1" style={{ borderTop: '1px solid rgba(201,150,42,0.15)' }}>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-white/5"
            style={{ color: '#F87171' }}
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

/* ── Mobile bottom tab bar — portaled to document.body ── */
function BottomTabBar({ onMoreClick, moreActive }) {
  return createPortal(
    <nav
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden flex items-stretch"
      style={{
        background: 'rgba(1, 31, 40, 0.97)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(201,150,42,0.25)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {BOTTOM_TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #C9962A, #E8B84B)' }}
                />
              )}
              <span
                className="flex items-center justify-center w-9 h-7 rounded-xl transition-all duration-200"
                style={isActive ? { background: 'rgba(113,178,128,0.15)' } : {}}
              >
                <Icon size={18} style={{ color: isActive ? '#71B280' : '#87BAC2' }} />
              </span>
              <span className="text-[10px] font-semibold tracking-wide" style={{ color: isActive ? '#71B280' : '#506860' }}>
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
        className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative"
      >
        {moreActive && (
          <span
            className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
            style={{ background: 'linear-gradient(90deg, #C9962A, #E8B84B)' }}
          />
        )}
        <span
          className="flex items-center justify-center w-9 h-7 rounded-xl transition-all duration-200"
          style={moreActive ? { background: 'rgba(113,178,128,0.15)' } : {}}
        >
          <MoreHorizontal size={18} style={{ color: moreActive ? '#71B280' : '#87BAC2' }} />
        </span>
        <span className="text-[10px] font-semibold tracking-wide" style={{ color: moreActive ? '#71B280' : '#506860' }}>
          More
        </span>
      </button>
    </nav>,
    document.body
  );
}

/* ── Root layout ── */
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifCount, setNotifCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(({ data }) => {
        const s = data.data;
        setNotifCount((s.messages?.new ?? 0) + (s.enrollments?.pending ?? 0));
      })
      .catch(() => {});
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const parentRoute = getParentRoute(location.pathname);
  const isLeaf = parentRoute !== null;

  const moreActive = MORE_ITEMS.some(({ to }) =>
    location.pathname === to || location.pathname.startsWith(to + '/')
  );

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path)
  )?.[1] ?? 'Admin';

  const today = new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#EDF4F2' }}>

      {/* Desktop sidebar — hidden on mobile */}
      <aside
        className="hidden lg:flex lg:flex-col lg:flex-shrink-0 lg:w-60 sidebar-stripe"
        style={{ background: 'linear-gradient(160deg, #013F4A 0%, #011F28 100%)' }}
      >
        <Sidebar />
      </aside>

      {/* Main — scrolls independently */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Top bar */}
        <header
          className="sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-shrink-0"
          style={{
            background: 'rgba(237,244,242,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(168,196,188,0.3)',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Back arrow — mobile only, detail/form pages only */}
            {isLeaf && (
              <button
                type="button"
                onClick={() => navigate(parentRoute)}
                className="lg:hidden flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-surface-200"
                style={{ background: '#fff', border: '1px solid rgba(168,196,188,0.4)', color: '#506860' }}
                aria-label="Go back"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl text-ink-900 leading-none truncate">{pageTitle}</h2>
              <p className="text-xs mt-0.5 hidden sm:block" style={{ color: '#506860' }}>{today}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              to="/admin/messages"
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-surface-200"
              style={{ background: '#fff', border: '1px solid rgba(168,196,188,0.4)', color: '#506860' }}
              aria-label={notifCount > 0 ? `${notifCount} notifications` : 'Notifications'}
            >
              <Bell size={15} />
              {notifCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ background: '#068562' }}
                >
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>

            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #068562, #71B280)', color: '#011F28' }}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile for tab bar */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Portaled outside the scroll container — safe on all mobile browsers */}
      <BottomTabBar onMoreClick={() => setMoreOpen(true)} moreActive={moreActive} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} onLogout={handleLogout} />
    </div>
  );
}
