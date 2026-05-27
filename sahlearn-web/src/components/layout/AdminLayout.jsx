import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, FileText,
  MessageSquare, Users, UserCog,
  LogOut, Sprout, Bell, GraduationCap,
} from 'lucide-react';

/* ── Nav config ── */
const SIDEBAR_MAIN = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/posts', label: 'Blog', icon: FileText },
];
const SIDEBAR_MANAGE = [
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/enrollments', label: 'Enrollments', icon: Users },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/team', label: 'Team', icon: UserCog },
];
const BOTTOM_TABS = [
  { to: '/admin', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/posts', label: 'Blog', icon: FileText },
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/enrollments', label: 'Enroll', icon: GraduationCap },
];
const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/courses': 'Courses',
  '/admin/posts': 'Blog Posts',
  '/admin/messages': 'Messages',
  '/admin/enrollments': 'Enrollments',
  '/admin/students': 'Students',
  '/admin/team': 'Team',
};

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
  const handleLogout = () => { logout(); navigate('/admin/login'); };
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

/* ── Mobile bottom tab bar ── */
function BottomTabBar() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden flex items-stretch"
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
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative group"
        >
          {({ isActive }) => (
            <>
              {/* Active pill indicator */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #C9962A, #E8B84B)' }}
                />
              )}

              {/* Icon container */}
              <span
                className="flex items-center justify-center w-9 h-7 rounded-xl transition-all duration-200"
                style={isActive
                  ? { background: 'rgba(113,178,128,0.15)' }
                  : {}
                }
              >
                <Icon
                  size={18}
                  style={{ color: isActive ? '#71B280' : '#87BAC2' }}
                />
              </span>

              {/* Label */}
              <span
                className="text-[10px] font-semibold tracking-wide transition-colors duration-200"
                style={{ color: isActive ? '#71B280' : '#506860' }}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/* ── Avatar dropdown (Team + Sign out) — mobile header ── */
function AvatarDropdown({ initials }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
        style={{
          background: open
            ? 'linear-gradient(135deg, #056B4E, #068562)'
            : 'linear-gradient(135deg, #068562, #71B280)',
          color: '#011F28',
          boxShadow: open ? '0 0 0 2px rgba(113,178,128,0.4)' : 'none',
        }}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initials}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 w-44 rounded-xl overflow-hidden z-50"
          style={{
            background: '#013F4A',
            border: '1px solid rgba(201,150,42,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          <NavLink
            to="/admin/team"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-3 text-sm transition-colors hover:bg-white/5"
            style={{ color: '#87BAC2' }}
          >
            <UserCog size={14} /> Team
          </NavLink>
          <div className="gold-divider mx-3" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-4 py-3 text-sm transition-colors hover:bg-white/5 text-left"
            style={{ color: '#87BAC2' }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Root layout ── */
export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

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
          <div className="min-w-0">
            <h2 className="font-display text-lg sm:text-xl text-ink-900 leading-none truncate">{pageTitle}</h2>
            <p className="text-xs mt-0.5 hidden sm:block" style={{ color: '#506860' }}>{today}</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
              style={{ background: '#fff', border: '1px solid rgba(168,196,188,0.4)', color: '#506860' }}
              aria-label="Notifications"
            >
              <Bell size={15} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ background: '#068562' }} />
            </button>

            {/* Desktop: plain avatar. Mobile: avatar with dropdown */}
            <div className="hidden lg:flex w-9 h-9 rounded-xl items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #068562, #71B280)', color: '#011F28' }}
            >
              {initials}
            </div>
            <div className="lg:hidden">
              <AvatarDropdown initials={initials} />
            </div>
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile for tab bar */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <BottomTabBar />
    </div>
  );
}
