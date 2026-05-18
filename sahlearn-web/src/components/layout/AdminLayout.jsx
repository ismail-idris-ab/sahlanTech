import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  MessageSquare,
  Users,
  UserCog,
  LogOut,
  Sprout,
  Bell,
  Search,
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

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative ${
          isActive
            ? 'bg-forest-accent/15 text-forest-accent'
            : 'text-forest-muted hover:text-white hover:bg-white/5'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-forest-accent rounded-r-full" />
          )}
          <Icon size={17} className="flex-shrink-0" />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path)
  )?.[1] ?? 'Admin';

  const today = new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex min-h-screen" style={{ background: '#F0F4EE' }}>

      {/* ─── Sidebar ─────────────────────────────────── */}
      <aside
        className="w-60 flex flex-col flex-shrink-0 fixed top-0 left-0 h-full z-30"
        style={{ background: 'linear-gradient(180deg, #0D2018 0%, #091812 100%)' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-forest-accent to-brand-primary flex items-center justify-center flex-shrink-0 shadow-green">
            <Sprout size={15} className="text-forest-950" />
          </div>
          <div>
            <span className="text-lg font-display text-white leading-none">sahlearn</span>
            <span className="block text-[10px] text-forest-muted tracking-widest uppercase leading-none mt-0.5">Admin</span>
          </div>
        </div>

        <div className="mx-5 h-px mb-4" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Nav */}
        <nav className="flex-1 px-3 overflow-y-auto">
          <p className="px-3.5 mb-2 text-[10px] font-semibold uppercase tracking-widest text-forest-muted/60">Menu</p>
          <div className="space-y-0.5 mb-5">
            {MAIN_NAV.map((item) => <NavItem key={item.to} {...item} />)}
          </div>

          <p className="px-3.5 mb-2 text-[10px] font-semibold uppercase tracking-widest text-forest-muted/60">Manage</p>
          <div className="space-y-0.5">
            {MANAGE_NAV.map((item) => <NavItem key={item.to} {...item} />)}
          </div>
        </nav>

        <div className="mx-5 h-px mt-4 mb-4" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* User */}
        <div className="px-3 pb-5">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-forest-accent flex items-center justify-center flex-shrink-0 text-forest-950 text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">{user?.name}</p>
              <p className="text-[11px] text-forest-muted truncate leading-tight">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-xl text-sm text-forest-muted hover:text-white hover:bg-white/5 transition-all duration-150"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── Main ─────────────────────────────────────── */}
      <div className="flex-1 ml-60 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-ink-300/20 px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-ink-900 leading-none">{pageTitle}</h2>
            <p className="text-xs text-ink-500 mt-0.5">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:flex items-center">
              <Search size={14} className="absolute left-3 text-ink-300" />
              <input
                type="text"
                placeholder="Search…"
                className="pl-8 pr-4 py-2 text-xs bg-surface-100 border border-ink-300/40 rounded-xl text-ink-700 placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 w-44 transition-all focus:w-56"
              />
            </div>
            <button className="relative w-9 h-9 rounded-xl bg-surface-100 border border-ink-300/30 flex items-center justify-center text-ink-500 hover:text-ink-900 hover:border-ink-300/60 transition-all">
              <Bell size={16} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-brand-primary" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-forest-accent flex items-center justify-center text-xs font-bold text-forest-950 flex-shrink-0">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
