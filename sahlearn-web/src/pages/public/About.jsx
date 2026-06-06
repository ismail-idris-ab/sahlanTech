import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FacebookIcon,
  LinkedinIcon,
  TwitterXIcon,
  YoutubeIcon,
  InstagramIcon,
  GithubIcon,
} from '../../components/common/SocialIcons';
import SEO from '../../components/common/SEO';
import { getContent } from '../../services/siteContent.service';

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

const DEFAULT_SECTIONS = [
  {
    title: 'Introduction',
    content: 'Sahlearn Technology is an educative institution that is officially established on 22nd August 2012 by its CEO Aliyu Saleh Muhammad Ajajah. It is currently located inside Tilden Fulani central primary school, Tilde, Toro LGA Bauchi State.',
  },
  {
    title: 'Our Goals',
    content: 'Sahlearn Technology is established to achieve the following goals;\n1. To empower you by making you self employed and self-reliance with best skills and attitude.\n2. To educate people on computer and it technologies using the simplest and fastest method.\n3. To make people able to solve the society problems by applying their thought knowledge, think critically and act smartly.\n\nWith these, we make our motto to "Set to benefit humanity" and make our theme to "impossible is what we do best"',
  },
  {
    title: 'Our Departments',
    content: 'Sahlearn Technology is made up of the following important departments:\n\n1. Training department: This department is in charge of teaching the computer skills and knowledge for the interested students.\n\n2. Business department: This department is in charge of buying and selling of computer related items and accessories.',
  },
];

function renderContent(text) {
  return (text || '').split(/\n\n+/).map((para, i) => (
    <p key={i} className="text-ink-700 leading-relaxed">
      {para.split('\n').map((line, j, arr) => (
        <span key={j}>
          {line}
          {j < arr.length - 1 && <br />}
        </span>
      ))}
    </p>
  ));
}

export default function About() {
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [socials, setSocials] = useState(ENV_SOCIALS);

  useEffect(() => {
    getContent('about_sections')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setSections(data);
      })
      .catch((err) => { console.error('Failed to load about sections:', err); });
    getContent('social_links')
      .then((data) => { if (Array.isArray(data) && data.length > 0) setSocials(data); })
      .catch(() => {});
  }, []);

  const visibleSocials = socials.filter((s) => s.url);

  return (
    <>
      <SEO
        title="About"
        description="Learn about Sahlearn — our mission, our instructor, and the digital skills we teach across Nigeria."
        url="/about"
      />

      {/* Breadcrumb + page title */}
      <section className="bg-white border-b border-ink-300/30 py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-ink-500 mb-3">
            <Link to="/" className="hover:text-brand-primary">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-ink-900">About</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900 font-display">
            About Sahlearn
          </h1>
        </div>
      </section>

      {/* Document sections */}
      <section className="py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {sections.map((sec, i) => (
            <div key={sec.title || i} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <div className="bg-[#013F4A] px-6 py-4 text-center">
                <h2 className="text-white font-bold tracking-widest uppercase text-sm m-0">
                  {sec.title}
                </h2>
              </div>
              <div className="bg-white px-6 py-5 space-y-3 border-t border-gray-200">
                {renderContent(sec.content)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social strip */}
      {visibleSocials.length > 0 && (
        <section className="py-10 border-t border-ink-300/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-4">
              Follow us on:
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {visibleSocials.map(({ platform, url, bg }) => {
                const Icon = ICON_MAP[platform];
                if (!Icon) return null;
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={platform}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                    style={{ background: bg }}
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
