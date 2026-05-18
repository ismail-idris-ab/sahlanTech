import { Link } from 'react-router-dom';
import { MessageCircle, Mail, Phone } from 'lucide-react';
import { FacebookIcon, LinkedinIcon, TwitterXIcon, YoutubeIcon, InstagramIcon, GithubIcon } from '../common/SocialIcons';

const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;

const SOCIALS = [
  { icon: FacebookIcon, href: import.meta.env.VITE_FACEBOOK_URL, label: 'Facebook' },
  { icon: LinkedinIcon, href: import.meta.env.VITE_LINKEDIN_URL, label: 'LinkedIn' },
  { icon: TwitterXIcon, href: import.meta.env.VITE_TWITTER_URL, label: 'X (Twitter)' },
  { icon: YoutubeIcon, href: import.meta.env.VITE_YOUTUBE_URL, label: 'YouTube' },
  { icon: InstagramIcon, href: import.meta.env.VITE_INSTAGRAM_URL, label: 'Instagram' },
  { icon: GithubIcon, href: import.meta.env.VITE_GITHUB_URL, label: 'GitHub' },
];

const QUICK_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/blog', label: 'Blog' },
  { to: '/contact', label: 'Contact' },
];

const COURSE_LINKS = [
  { to: '/courses?category=Design', label: 'Design' },
  { to: '/courses?category=Office', label: 'Office' },
  { to: '/courses?category=AI', label: 'AI' },
  { to: '/courses?category=Marketing', label: 'Marketing' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink-900 text-surface-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <p className="text-xl font-bold font-display text-white mb-3">sahlearn.</p>
            <p className="text-ink-300 text-sm leading-relaxed">
              Practical digital skills, taught simply. Empowering learners across Nigeria.
            </p>
            <a
              href={`https://wa.me/${WA_NUM}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
            <div className="flex items-center gap-3 mt-5">
              {SOCIALS.filter((s) => s.href).map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-primary flex items-center justify-center text-ink-300 hover:text-white transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Quick Links</p>
            <ul className="space-y-2">
              {QUICK_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-ink-300 hover:text-white text-sm transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Courses */}
          <div>
            <p className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Courses</p>
            <ul className="space-y-2">
              {COURSE_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="text-ink-300 hover:text-white text-sm transition-colors">{label}</Link>
                </li>
              ))}
              <li>
                <Link to="/courses" className="text-brand-accent hover:text-yellow-300 text-sm transition-colors font-medium">
                  Browse all →
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">Contact</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-ink-300 text-sm">
                <MessageCircle size={15} className="text-green-500 flex-shrink-0" />
                <span>{WA_NUM}</span>
              </li>
              <li className="flex items-center gap-2 text-ink-300 text-sm">
                <Mail size={15} className="text-brand-primary flex-shrink-0" />
                <span>hello@sahlearn.com</span>
              </li>
              <li className="flex items-center gap-2 text-ink-300 text-sm">
                <Phone size={15} className="text-brand-accent flex-shrink-0" />
                <span>Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-ink-500">
          <p>© {year} Sahlearn. All rights reserved.</p>
          <Link to="/admin/login" className="hover:text-ink-300 transition-colors">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
