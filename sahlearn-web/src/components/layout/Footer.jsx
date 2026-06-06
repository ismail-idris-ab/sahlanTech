import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Mail, Phone } from 'lucide-react';
import { FacebookIcon, LinkedinIcon, TwitterXIcon, YoutubeIcon, InstagramIcon, GithubIcon } from '../common/SocialIcons';
import { getContent } from '../../services/siteContent.service';

const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;

const ICON_MAP = {
  Facebook: FacebookIcon,
  LinkedIn: LinkedinIcon,
  'X (Twitter)': TwitterXIcon,
  YouTube: YoutubeIcon,
  Instagram: InstagramIcon,
  GitHub: GithubIcon,
};

const ENV_SOCIALS = [
  { platform: 'Facebook',    url: import.meta.env.VITE_FACEBOOK_URL,  bg: '#1877F2' },
  { platform: 'LinkedIn',    url: import.meta.env.VITE_LINKEDIN_URL,  bg: '#0077B5' },
  { platform: 'X (Twitter)', url: import.meta.env.VITE_TWITTER_URL,   bg: '#000000' },
  { platform: 'YouTube',     url: import.meta.env.VITE_YOUTUBE_URL,   bg: '#FF0000' },
  { platform: 'Instagram',   url: import.meta.env.VITE_INSTAGRAM_URL, bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' },
  { platform: 'GitHub',      url: import.meta.env.VITE_GITHUB_URL,    bg: '#24292e' },
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
  const [socials, setSocials] = useState(ENV_SOCIALS);

  useEffect(() => {
    getContent('social_links')
      .then((data) => { if (Array.isArray(data) && data.length > 0) setSocials(data); })
      .catch(() => {});
  }, []);

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
              {socials.filter((s) => s.url).map(({ platform, url, bg }) => {
                const Icon = ICON_MAP[platform];
                if (!Icon) return null;
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={platform}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                    style={{ background: bg }}
                  >
                    <Icon size={15} />
                  </a>
                );
              })}
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
