import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle,
  Layers,
  Clock,
  ShieldCheck,
  Headphones,
  Palette,
  Cpu,
  LayoutDashboard,
  TrendingUp,
  Pencil,
  Monitor,
  Globe,
  ChevronDown,
} from "lucide-react";
import { getCourses } from "../../services/courses.service";
import { getPosts } from "../../services/posts.service";
import { getContent } from "../../services/siteContent.service";
import CourseCard from "../../components/courses/CourseCard";
import BlogCard from "../../components/blog/BlogCard";
import SEO from "../../components/common/SEO";
import HeroBg from "../../components/common/HeroBg";

const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;

function initials(name) {
  return (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function TestimonialCard({ testimonial }) {
  const { name, role, text, avatarUrl } = testimonial;
  return (
    <div className="bg-white rounded-2xl border border-ink-300/40 p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="text-brand-primary/30">
        <svg width="28" height="20" viewBox="0 0 28 20" fill="currentColor">
          <path d="M0 20V12.667C0 5.556 4.148 1.37 12.444 0l1.334 2.222C9.926 3.185 7.926 5.037 7.111 7.778H12V20H0zm16 0V12.667C16 5.556 20.148 1.37 28.444 0l1.334 2.222C25.926 3.185 23.926 5.037 23.111 7.778H28V20H16z" />
        </svg>
      </div>
      <p className="text-ink-700 text-sm leading-relaxed flex-1">{text}</p>
      <div className="flex items-center gap-3 pt-2 border-t border-ink-300/20">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-brand-primary">
            {initials(name)}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-ink-900">{name}</p>
          {role && <p className="text-xs text-ink-400">{role}</p>}
        </div>
      </div>
    </div>
  );
}

const CATEGORIES = [
  {
    icon: Palette,
    title: "Graphic Design",
    desc: "Canva, CorelDRAW, Figma basics, for social media, branding & more",
    popular: true,
  },
  {
    icon: Cpu,
    title: "AI Tools",
    desc: "ChatGPT, automation & more, for work and business",
    popular: false,
  },
  {
    icon: LayoutDashboard,
    title: "Office Productivity",
    desc: "Excel, Word, Google Workspace, presentations",
    popular: false,
  },
  {
    icon: TrendingUp,
    title: "Digital Marketing",
    desc: "Social media, SEO, ads",
    popular: false,
  },
  {
    icon: Globe,
    title: "Web Development",
    desc: "HTML, CSS, JavaScript, React, WordPress",
    popular: false,
  },
];

const TAGS = [
  { label: "Design", icon: Pencil },
  { label: "AI Tools", icon: Cpu },
  { label: "Office", icon: Monitor },
  { label: "Marketing", icon: TrendingUp },
  { label: "Web Development", icon: Globe },
];

const FAQS = [
  {
    q: "How do I enroll in a course?",
    a: 'Click "Enroll Now" on any course page and fill in the short form. We\'ll confirm your spot via WhatsApp or email within 24 hours.',
  },
  {
    q: "Are the courses online or in-person?",
    a: "Both. Most courses run online via video lessons and live sessions. In-person classes are available in Lagos for selected courses — check each course page for details.",
  },
  {
    q: "Do I receive a certificate after completing a course?",
    a: "Yes. Every student who completes a course and passes the final assessment receives a Sahlearn certificate of completion.",
  },
  {
    q: "How long does each course take?",
    a: "Course length varies. Short skill courses run 2–4 weeks; comprehensive courses run 6–8 weeks. Each course page shows the exact duration and weekly time commitment.",
  },
  {
    q: "What do I need to get started?",
    a: "A smartphone or laptop and a stable internet connection. No prior experience is required for beginner courses — we start from the basics.",
  },
  {
    q: "Can I pay in instalments?",
    a: "Yes. Instalment plans are available for most courses. Reach out on WhatsApp before enrolling and we'll set up a payment schedule that works for you.",
  },
];

const WHY = [
  {
    icon: Layers,
    title: "Practical Projects",
    desc: "Learn by doing real-world projects, not just theory.",
  },
  {
    icon: Clock,
    title: "Flexible Learning",
    desc: "Study at your own pace, online or in-person.",
  },
  {
    icon: ShieldCheck,
    title: "Trusted Teacher",
    desc: "Experienced instructor with proven results.",
  },
  {
    icon: Headphones,
    title: "WhatsApp Support",
    desc: "Get help directly via WhatsApp whenever you need it.",
  },
];

export default function Home() {
  const [courses, setCourses] = useState(null);
  const [posts, setPosts] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    getCourses({ limit: 6 })
      .then((r) => setCourses(r.data))
      .catch(() => setCourses([]));
    getPosts({ limit: 3 })
      .then((r) => setPosts(r.data))
      .catch(() => {});
    getContent('testimonials')
      .then((data) => setTestimonials(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => {});
  }, []);

  const waLink = `https://wa.me/${WA_NUM}?text=${encodeURIComponent("Hi Sahlearn, I'd like to learn more about your courses.")}`;

  return (
    <>
      <SEO url="/" />
      {/* Hero */}
      <section className="relative overflow-hidden bg-white border-b border-ink-300/30">
        <HeroBg />
        {/* Glow blobs */}
        <div className="pointer-events-none absolute -top-16 -left-20 w-96 h-96 rounded-full bg-brand-primary/6 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 w-80 h-80 rounded-full bg-brand-accent/6 blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — copy + CTAs */}
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                Now Enrolling
              </div>
              <h1 className="text-3xl leading-tight sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-ink-900 font-display tracking-normal">
                Learn Practical{" "}
                <span className="italic leading-relaxed text-brand-primary tracking-wider">
                  Digital
                </span>
                <br />
                <span className="text-brand-primary">Skills</span> with
                Confidence
              </h1>

              <p className="text-ink-500 text-lg mt-5 leading-relaxed max-w-md">
                Design, AI tools, office productivity &amp; digital marketing —
                real training from an experienced Nigerian instructor. Online or
                in-person. Start when you're ready.
              </p>

              {/* Topic tags */}
              <div className="flex flex-wrap gap-2 mt-6">
                {TAGS.map(({ label, icon: Icon }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-100 border border-ink-300/50 rounded-full text-xs font-medium text-ink-700"
                  >
                    <Icon size={12} className="text-brand-primary" />
                    {label}
                  </span>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link
                  to="/courses"
                  className="px-6 py-3.5 text-white font-semibold rounded-xl text-center transition-all duration-200 hover:opacity-90 hover:shadow-[0_8px_24px_rgba(6,133,98,0.35)] hover:-translate-y-0.5 active:translate-y-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #068562 0%, #013F4A 100%)",
                  }}
                >
                  Browse Courses
                </Link>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-ink-900 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_4px_16px_rgba(6,133,98,0.15)]"
                  style={{
                    background:
                      "linear-gradient(white, white) padding-box, linear-gradient(135deg, #068562, #013F4A) border-box",
                    border: "1.5px solid transparent",
                  }}
                >
                  <MessageCircle size={16} />
                  Talk on WhatsApp
                </a>
              </div>
            </div>

            {/* Right — course category cards (desktop only) */}
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-widest mb-4">
                What You'll Learn
              </p>
              <div className="flex flex-col gap-3">
                {CATEGORIES.map(({ icon: Icon, title, desc, popular }, i) => (
                  <div
                    key={title}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-ink-300/40 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={20} className="text-brand-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-ink-900 text-sm">
                        {title}
                      </p>
                      <p className="text-ink-500 text-xs mt-0.5">{desc}</p>
                    </div>
                    {popular && (
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-accent/15 text-brand-accent flex-shrink-0">
                        Popular
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-ink-900 font-display">
                Popular Courses
              </h2>
              <p className="text-ink-500 mt-1">Start learning today.</p>
            </div>
            <Link
              to="/courses"
              className="text-brand-primary hover:underline text-sm font-medium hidden sm:block"
            >
              View all →
            </Link>
          </div>

          {courses === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl h-72 animate-pulse border border-ink-300/40"
                />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <p className="text-ink-500 text-sm">
              No courses available yet. Check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          )}

          <div className="mt-6 sm:hidden text-center">
            <Link
              to="/courses"
              className="text-brand-primary hover:underline text-sm font-medium"
            >
              View all courses →
            </Link>
          </div>
        </div>
      </section>

      {/* About teaser */}
      <section className="bg-white py-16 md:py-20 border-y border-ink-300/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div
              className="rounded-2xl overflow-hidden h-72 lg:h-96 flex flex-col items-center justify-center gap-4"
              style={{ background: 'linear-gradient(145deg, #013F4A 0%, #011F28 100%)' }}
            >
              <img src="/sahlearn-icon.svg" alt="Sahlearn" className="w-24 h-24 opacity-90" />
              <p className="text-sm font-medium" style={{ color: '#71B280' }}>sahlearn</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider">
                About Sahlearn
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-ink-900 font-display mt-2 mb-4">
                Your trusted digital skills instructor
              </h2>
              <p className="text-ink-700 leading-relaxed mb-4">
                Sahlearn is built around one goal: making practical digital
                skills accessible to every Nigerian learner. Our courses are
                designed to be hands-on, relevant, and directly applicable to
                your career or business.
              </p>
              <p className="text-ink-700 leading-relaxed mb-6">
                Whether you're learning CorelDRAW for the first time or
                mastering AI tools for your business, we meet you where you are.
              </p>
              <Link
                to="/about"
                className="text-brand-primary font-medium hover:underline"
              >
                Read more about us →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Sahlearn */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-ink-900 font-display">
              Why Choose Sahlearn?
            </h2>
            <p className="text-ink-500 mt-2">Everything you need to succeed.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-6 border border-ink-300/40 text-center hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-brand-primary" />
                </div>
                <h3 className="font-semibold text-ink-900 mb-1">{title}</h3>
                <p className="text-ink-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="bg-white py-16 md:py-20 border-y border-ink-300/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-brand-primary uppercase tracking-widest">
                Student Stories
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-ink-900 font-display mt-2">
                What our students say
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <TestimonialCard key={i} testimonial={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Blog */}
      {posts.length > 0 && (
        <section className="bg-white py-16 md:py-20 border-y border-ink-300/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-ink-900 font-display">
                  Latest from the Blog
                </h2>
                <p className="text-ink-500 mt-1">
                  Tips, tutorials, and updates.
                </p>
              </div>
              <Link
                to="/blog"
                className="text-brand-primary hover:underline text-sm font-medium hidden sm:block"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-white py-16 md:py-24 border-t border-ink-300/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12 lg:gap-16 items-start">
            {/* Left — accordion */}
            <div>
              <span className="text-xs font-semibold text-brand-primary uppercase tracking-widest">
                FAQ
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-ink-900 font-display mt-2 mb-8">
                Frequently Asked Questions
              </h2>

              <div className="divide-y divide-ink-300/30">
                {FAQS.map(({ q, a }, i) => {
                  const open = openFaq === i;
                  return (
                    <div key={i}>
                      <button
                        onClick={() => setOpenFaq(open ? null : i)}
                        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
                        aria-expanded={open}
                      >
                        <span
                          className={`font-semibold text-sm md:text-base transition-colors ${open ? "text-brand-primary" : "text-ink-900 group-hover:text-brand-primary"}`}
                        >
                          {q}
                        </span>
                        <ChevronDown
                          size={18}
                          className={`flex-shrink-0 text-ink-500 transition-transform duration-200 ${open ? "rotate-180 text-brand-primary" : ""}`}
                        />
                      </button>
                      <div
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{ maxHeight: open ? "200px" : "0px" }}
                      >
                        <p className="text-ink-500 text-sm leading-relaxed pb-5 pr-8">
                          {a}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right — help card */}
            <div className="lg:sticky lg:top-8">
              <div
                className="rounded-2xl p-8 text-white"
                style={{
                  background:
                    "linear-gradient(145deg, #068562 0%, #013F4A 100%)",
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-5">
                  <MessageCircle size={22} className="text-white" />
                </div>
                <h3 className="font-bold text-xl font-display mb-2">
                  Still have questions?
                </h3>
                <p className="text-white/75 text-sm leading-relaxed mb-6">
                  Can't find the answer you're looking for? Chat with us
                  directly on WhatsApp — we respond fast.
                </p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-brand-primary font-semibold text-sm hover:bg-surface-50 transition-colors mb-3"
                >
                  <MessageCircle size={16} /> Chat on WhatsApp
                </a>
                <Link
                  to="/contact"
                  className="flex items-center justify-center w-full py-3 rounded-xl border border-white/30 text-white font-medium text-sm hover:bg-white/10 transition-colors"
                >
                  Send a message →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
