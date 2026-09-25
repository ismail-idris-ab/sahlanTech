import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/courses', label: 'Courses' },
  { to: '/quiz', label: 'Daily Quiz' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

const EXT_LINKS = [
  { href: 'https://sahlearn.com.ng/store.php', label: 'Store' },
  { href: 'https://sahlearn.com.ng/sahleanTV.php', label: 'TV' },
  { href: 'https://sahlearn.com.ng/sahlearnRadio.php', label: 'Radio' },
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

  // Stop the page behind the drawer from scrolling. Without this, dragging
  // inside the menu scrolls the page underneath it on iOS.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

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
            {EXT_LINKS.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-ink-700 hover:text-brand-primary transition-colors"
              >
                {label}
              </a>
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
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay. Always mounted so it can fade with the drawer
          instead of snapping in and out. */}
      <div
        onClick={close}
        aria-hidden="true"
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-300 md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Mobile drawer.
          A three-part column: the logo bar and the two actions stay put while
          only the link list scrolls. The previous version was a single block
          taller than a small phone screen, so Student Login and Enroll Now fell
          below the fold with no way to reach them.
          100dvh, not h-full: on mobile browsers the viewport shrinks as the
          address bar appears, and 100vh does not follow it. */}
      <div
        id="mobile-menu"
        inert={!open}
        aria-hidden={!open}
        /* h-screen below is the 100vh fallback: browsers that understand dvh
           take this inline value, older ones drop it and keep the class. */
        style={{ height: '100dvh' }}
        className={`fixed top-0 right-0 z-40 flex h-screen w-72 max-w-[85vw] flex-col bg-white shadow-xl transition-transform duration-300 md:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-shrink-0 items-center justify-between px-5 h-16 border-b border-ink-300/40">
          <img src="/sahlearn-logo.svg" alt="Sahlearn" className="h-7 w-auto" />
          <button onClick={close} className="p-2 text-ink-700" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        {/* overscroll-contain stops a flick at the end of this list from
            scrolling the page behind the drawer. */}
        <nav className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 space-y-1">
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
          {EXT_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="block px-4 py-3 rounded-lg text-sm font-medium text-ink-700 hover:bg-surface-100 transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Pinned to the bottom rather than sitting at the end of the list, so
            Enroll Now is visible the moment the menu opens on any screen size.
            The safe-area padding keeps it clear of the home indicator on
            notched phones. */}
        <div
          className="flex-shrink-0 border-t border-ink-300/40 px-4 py-4 space-y-2"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
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
      </div>
    </>
  );
}
