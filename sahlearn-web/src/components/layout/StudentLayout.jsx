// sahlearn-web/src/components/layout/StudentLayout.jsx
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { LayoutDashboard, BookOpen, User, LogOut, Sprout } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/courses', label: 'My Courses', icon: BookOpen },
  { to: '/student/profile', label: 'Profile', icon: User },
];

function SideNavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-ink-500 hover:text-ink-900 hover:bg-surface-200'
        }`
      }
    >
      <Icon size={17} className="flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
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
    <div className="flex h-screen overflow-hidden bg-surface-100">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 bg-white border-r border-surface-200 flex-shrink-0">
        <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-brand-primary">
            <Sprout size={16} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-display text-ink-900 leading-none">sahlearn</span>
            <span className="block text-[10px] tracking-widest uppercase leading-none mt-0.5 text-brand-primary">Student Portal</span>
          </div>
        </div>

        <div className="mx-5 border-t border-surface-200 mb-4" />

        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => <SideNavItem key={item.to} {...item} />)}
        </nav>

        <div className="mx-5 border-t border-surface-200 mt-4 mb-4" />

        <div className="px-3 pb-5">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1">
            {student?.avatar?.url ? (
              <img src={student.avatar.url} alt={student.fullName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold bg-brand-primary/10 text-brand-primary">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink-900 truncate">{student?.fullName}</p>
              <p className="text-[11px] text-ink-400 truncate">{student?.studentId}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 rounded-xl text-sm text-ink-500 hover:text-ink-900 hover:bg-surface-200 transition-all"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
