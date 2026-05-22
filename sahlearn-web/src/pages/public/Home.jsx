import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Layers, Clock, ShieldCheck, Headphones } from 'lucide-react';
import { getCourses } from '../../services/courses.service';
import { getPosts } from '../../services/posts.service';
import CourseCard from '../../components/courses/CourseCard';
import BlogCard from '../../components/blog/BlogCard';
import SEO from '../../components/common/SEO';
import DottedSurface from '../../components/common/DottedSurface';

const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;

const WHY = [
  { icon: Layers, title: 'Practical Projects', desc: 'Learn by doing real-world projects, not just theory.' },
  { icon: Clock, title: 'Flexible Learning', desc: 'Study at your own pace, online or in-person.' },
  { icon: ShieldCheck, title: 'Trusted Teacher', desc: 'Experienced instructor with proven results.' },
  { icon: Headphones, title: 'WhatsApp Support', desc: 'Get help directly via WhatsApp whenever you need it.' },
];

export default function Home() {
  const [courses, setCourses] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getCourses({ limit: 6 }).then((r) => setCourses(r.data)).catch(() => setCourses([]));
    getPosts({ limit: 3 }).then((r) => setPosts(r.data)).catch(() => {});
  }, []);

  const waLink = `https://wa.me/${WA_NUM}?text=${encodeURIComponent("Hi Sahlearn, I'd like to learn more about your courses.")}`;

  return (
    <>
      <SEO url="/" />
      {/* Hero */}
      <section className="relative overflow-hidden bg-white border-b border-ink-300/30">
        <DottedSurface />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            <span className="inline-block bg-brand-accent/15 text-brand-accent text-xs font-semibold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
              Digital Skills Training
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-ink-900 font-display leading-tight tracking-tight">
              Practical digital skills,<br className="hidden sm:block" /> taught simply.
            </h1>
            <p className="text-ink-500 text-lg md:text-xl mt-6 leading-relaxed">
              Learn design, office tools, AI, and marketing from an experienced Nigerian instructor — online or in-person.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link
                to="/courses"
                className="px-6 py-3.5 bg-brand-primary text-white font-semibold rounded-lg hover:bg-brand-primaryDark transition-colors text-center"
              >
                Explore Courses
              </Link>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3.5 border border-ink-300 text-ink-900 font-medium rounded-lg hover:bg-surface-100 transition-colors"
              >
                <MessageCircle size={18} className="text-green-500" /> Talk on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-ink-900 font-display">Popular Courses</h2>
              <p className="text-ink-500 mt-1">Start learning today.</p>
            </div>
            <Link to="/courses" className="text-brand-primary hover:underline text-sm font-medium hidden sm:block">
              View all →
            </Link>
          </div>

          {courses === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-72 animate-pulse border border-ink-300/40" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <p className="text-ink-500 text-sm">No courses available yet. Check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          )}

          <div className="mt-6 sm:hidden text-center">
            <Link to="/courses" className="text-brand-primary hover:underline text-sm font-medium">View all courses →</Link>
          </div>
        </div>
      </section>

      {/* About teaser */}
      <section className="bg-white py-16 md:py-20 border-y border-ink-300/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden bg-surface-100 h-72 lg:h-96 flex items-center justify-center">
              <span className="text-ink-400 text-sm">Teacher photo</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-brand-primary uppercase tracking-wider">About Sahlearn</span>
              <h2 className="text-2xl md:text-3xl font-bold text-ink-900 font-display mt-2 mb-4">
                Your trusted digital skills instructor
              </h2>
              <p className="text-ink-700 leading-relaxed mb-4">
                Sahlearn is built around one goal: making practical digital skills accessible to every Nigerian learner. Our courses are designed to be hands-on, relevant, and directly applicable to your career or business.
              </p>
              <p className="text-ink-700 leading-relaxed mb-6">
                Whether you're learning CorelDRAW for the first time or mastering AI tools for your business, we meet you where you are.
              </p>
              <Link to="/about" className="text-brand-primary font-medium hover:underline">
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
            <h2 className="text-2xl md:text-3xl font-bold text-ink-900 font-display">Why Choose Sahlearn?</h2>
            <p className="text-ink-500 mt-2">Everything you need to succeed.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-ink-300/40 text-center hover:shadow-md transition-shadow">
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

      {/* Latest Blog */}
      {posts.length > 0 && (
        <section className="bg-white py-16 md:py-20 border-y border-ink-300/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-ink-900 font-display">Latest from the Blog</h2>
                <p className="text-ink-500 mt-1">Tips, tutorials, and updates.</p>
              </div>
              <Link to="/blog" className="text-brand-primary hover:underline text-sm font-medium hidden sm:block">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((p) => <BlogCard key={p.id} post={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="bg-brand-primary py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white font-display mb-3">Ready to learn?</h2>
          <p className="text-blue-100 mb-8 text-lg">Join learners building real skills with Sahlearn.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/enroll"
              className="px-8 py-3.5 bg-brand-accent text-ink-900 font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
            >
              Enroll Now
            </Link>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-8 py-3.5 border border-white/40 text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              <MessageCircle size={18} /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
