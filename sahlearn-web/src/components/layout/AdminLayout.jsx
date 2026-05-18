import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, FileText,
  MessageSquare, Users, UserCog,
  LogOut, Sprout, Bell, Menu, X, ChevronRight,
} from 'lucide-react';

const MAIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/posts', label: 'Blog', icon: FileText },
];

const MANAGE_NAV = [
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/enrollments', label: 'Enrollments', icon: Users },
  { to: '/admin/team', label: 'Team', icon: UserCog },
];

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/courses': 'Courses',
  '/admin/posts': 'Blog Posts',
  '/admin/messages': 'Messages',
  '/admin/enrollments': 'Enrollments',
  '/admin/team': 'Team',
};

function NavItem({ to, label, icon: Icon, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
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

function Sidebar({ onNavigate }) {
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
            style={{
              background: 'linear-gradient(135deg, #C9962A, #E8B84B)',
              boxShadow: '0 4px 12px rgba(201,150,42,0.4)',
            }}
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

      {/* Nav */}
      <nav className="relative z-10 flex-1 px-3 overflow-y-auto space-y-5">
        <div>
          <p className="px-3.5 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(135,186,194,0.5)' }}>
            Menu
          </p>
          <div className="space-y-0.5">
            {MAIN_NAV.map((item) => <NavItem key={item.to} {...item} onNavigate={onNavigate} />)}
          </div>
        </div>
        <div>
          <p className="px-3.5 mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(135,186,194,0.5)' }}>
            Manage
          </p>
          <div className="space-y-0.5">
            {MANAGE_NAV.map((item) => <NavItem key={item.to} {...item} onNavigate={onNavigate} />)}
          </div>
        </div>
      </nav>

      <div className="relative z-10 mx-5 mt-4 mb-4 gold-divider" />

      {/* User */}
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

export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path)
  )?.[1] ?? 'Admin';

  const today = new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#EDF4F2' }}>

      {/* ── Mobile backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──
          Mobile: fixed overlay, slides in from left.
          Desktop (lg+): in normal flow, flex-shrink-0 — no ml-* offset needed. */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 flex flex-col flex-shrink-0 sidebar-stripe
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:inset-y-auto lg:left-auto lg:z-auto lg:translate-x-0 lg:w-60
        `}
        style={{ background: 'linear-gradient(160deg, #013F4A 0%, #011F28 100%)' }}
      >
        {/* Mobile close button */}
        <button
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg text-forest-muted hover:text-white hover:bg-white/10 transition-colors lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X size={16} />
        </button>

        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      {/* ── Main — scrolls independently ── */}
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
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all"
              style={{ background: '#fff', border: '1px solid rgba(168,196,188,0.4)', color: '#506860' }}
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={17} />
            </button>

            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl text-ink-900 leading-none truncate">{pageTitle}</h2>
              <p className="text-xs mt-0.5 hidden sm:block" style={{ color: '#506860' }}>{today}</p>
            </div>
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

            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #068562, #71B280)', color: '#011F28' }}
            >
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
