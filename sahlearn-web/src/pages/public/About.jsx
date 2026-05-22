import { Link } from "react-router-dom";
import { Award, Users, BookOpen, MessageCircle } from "lucide-react";
import {
  FacebookIcon,
  LinkedinIcon,
  TwitterXIcon,
  YoutubeIcon,
  InstagramIcon,
  GithubIcon,
} from "../../components/common/SocialIcons";
import SEO from "../../components/common/SEO";

const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;

const SOCIALS = [
  {
    icon: FacebookIcon,
    href: import.meta.env.VITE_FACEBOOK_URL,
    label: "Facebook",
  },
  {
    icon: LinkedinIcon,
    href: import.meta.env.VITE_LINKEDIN_URL,
    label: "LinkedIn",
  },
  {
    icon: TwitterXIcon,
    href: import.meta.env.VITE_TWITTER_URL,
    label: "X (Twitter)",
  },
  {
    icon: YoutubeIcon,
    href: import.meta.env.VITE_YOUTUBE_URL,
    label: "YouTube",
  },
  {
    icon: InstagramIcon,
    href: import.meta.env.VITE_INSTAGRAM_URL,
    label: "Instagram",
  },
  { icon: GithubIcon, href: import.meta.env.VITE_GITHUB_URL, label: "GitHub" },
];

const CREDENTIALS = [
  {
    icon: Award,
    label: "Certified Instructor",
    desc: "Professionally trained in digital skills education",
  },
  {
    icon: Users,
    label: "Hundreds of Students",
    desc: "Learners trained across Nigeria",
  },
  {
    icon: BookOpen,
    label: "Multi-subject",
    desc: "Design, Office, AI, Marketing and more",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp-first",
    desc: "Always reachable and responsive",
  },
];

const TEACHES = [
  { label: "Design", category: "Design" },
  { label: "Office Productivity", category: "Office" },
  { label: "AI Tools", category: "AI" },
  { label: "Digital Marketing", category: "Marketing" },
];

export default function About() {
  return (
    <>
      <SEO
        title="About"
        description="Learn about Sahlearn — our mission, our instructor, and the digital skills we teach across Nigeria."
        url="/about"
      />
      {/* Hero strip */}
      <section className="bg-white border-b border-ink-300/30 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-ink-500 mb-4">
            <Link to="/" className="hover:text-brand-primary">
              Home
            </Link>
            <span className="mx-2">/</span>
            <span className="text-ink-900">About</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900 font-display">
            About Sahlearn
          </h1>
          <p className="text-ink-500 mt-2 text-lg">
            Our mission, our teacher, and what we teach.
          </p>
        </div>
      </section>

      {/* Teacher bio */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div>
              <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider">
                Our Instructor
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-ink-900 font-display mt-2 mb-4">
                Meet your teacher
              </h2>
              <div className="space-y-4 text-ink-700 leading-relaxed">
                <p>
                  Sahlearn was founded with a simple belief: every Nigerian
                  deserves access to practical, affordable digital skills
                  training. Our instructor brings years of hands-on experience
                  to every lesson.
                </p>
                <p>
                  We don't just teach theory. Every course is built around
                  real-world projects you can use immediately — whether you're
                  starting a business, upgrading your career, or building
                  freelance income.
                </p>
                <p>
                  Our students come from diverse backgrounds — students,
                  entrepreneurs, civil servants, traders — and we meet each one
                  exactly where they are.
                </p>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/courses"
                  className="px-5 py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primaryDark transition-colors text-sm text-center"
                >
                  Browse Courses
                </Link>
                <a
                  href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent("Hi, I'd like to know more about Sahlearn.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-3 border border-ink-300 text-ink-900 font-medium rounded-lg hover:bg-surface-100 transition-colors text-sm"
                >
                  <MessageCircle size={16} className="text-green-500" />{" "}
                  WhatsApp Us
                </a>
              </div>
              {SOCIALS.filter((s) => s.href).length > 0 && (
                <div className="mt-5 flex items-center gap-3">
                  <span className="text-sm text-ink-500">Follow:</span>
                  {SOCIALS.filter((s) => s.href).map(
                    ({ icon: Icon, href, label }) => (
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={label}
                        className="w-9 h-9 rounded-full bg-surface-100 border border-ink-300/60 flex items-center justify-center text-ink-500 hover:border-brand-primary hover:text-brand-primary transition-colors"
                      >
                        <Icon size={16} />
                      </a>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Credentials */}
      <section className="bg-white border-y border-ink-300/30 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-ink-900 font-display text-center mb-10">
            Why trust Sahlearn?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CREDENTIALS.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="text-center p-6 rounded-xl border border-ink-300/40 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-brand-primary" />
                </div>
                <h3 className="font-semibold text-ink-900 mb-1">{label}</h3>
                <p className="text-ink-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What I teach */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-ink-900 font-display mb-2">
            What we teach
          </h2>
          <p className="text-ink-500 mb-8">
            Practical digital skills across four core areas.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TEACHES.map(({ label, category }) => (
              <Link
                key={label}
                to={`/courses?category=${category}`}
                className="bg-white rounded-xl border border-ink-300/40 p-5 text-center font-medium text-ink-900 hover:border-brand-primary hover:text-brand-primary hover:shadow-md transition-all"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-primary py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white font-display mb-3">
            Have questions?
          </h2>
          <p className="text-blue-100 mb-8">
            Reach out and we'll respond within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/contact"
              className="px-8 py-3.5 bg-white text-brand-primary font-semibold rounded-lg hover:bg-surface-100 transition-colors"
            >
              Contact Us
            </Link>
            <a
              href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent("Hi Sahlearn, I have a question.")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-3.5 border border-white/40 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              <MessageCircle size={18} /> WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
