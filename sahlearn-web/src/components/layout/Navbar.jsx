import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/courses', label: 'Courses' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close drawer on route change
  const close = () => setOpen(false);

  return (
    <>
      <header className={`sticky top-0 z-40 bg-white transition-shadow ${scrolled ? 'shadow-sm' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0" onClick={close} aria-label="Sahlearn home">
            <img src="/sahlearn-logo.svg" alt="Sahlearn" className="h-10 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${isActive ? 'text-brand-primary' : 'text-ink-700 hover:text-brand-primary'}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/student/login"
              className="px-4 py-2 border border-ink-300 text-ink-700 text-sm font-medium rounded-lg hover:border-brand-primary hover:text-brand-primary transition-colors"
            >
              Student Login
            </Link>
            <Link
              to="/enroll"
              className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-brand-primaryDark transition-colors"
            >
              Enroll Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-ink-700 hover:text-brand-primary transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={close}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 z-40 h-full w-72 bg-white shadow-xl transition-transform duration-300 md:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-ink-300/40">
          <img src="/sahlearn-logo.svg" alt="Sahlearn" className="h-7 w-auto" />
          <button onClick={close} className="p-2 text-ink-700" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="px-4 py-6 space-y-1">
          {LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={close}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-primary/10 text-brand-primary' : 'text-ink-700 hover:bg-surface-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <div className="pt-4 space-y-2">
            <Link
              to="/student/login"
              onClick={close}
              className="block w-full text-center px-4 py-3 border border-ink-300 text-ink-700 text-sm font-medium rounded-lg hover:border-brand-primary hover:text-brand-primary transition-colors"
            >
              Student Login
            </Link>
            <Link
              to="/enroll"
              onClick={close}
              className="block w-full text-center px-4 py-3 bg-brand-primary text-white text-sm font-medium rounded-lg hover:bg-brand-primaryDark transition-colors"
            >
              Enroll Now
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
