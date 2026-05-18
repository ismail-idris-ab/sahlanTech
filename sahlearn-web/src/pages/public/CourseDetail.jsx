import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, BarChart2, MessageCircle } from 'lucide-react';
import { getCourseBySlug } from '../../services/courses.service';
import SEO from '../../components/common/SEO';

const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;

export default function CourseDetail() {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getCourseBySlug(slug)
      .then(setCourse)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="max-w-7xl mx-auto px-4 py-24 text-center">
      <h1 className="text-4xl font-bold text-ink-900">Course not found</h1>
      <Link to="/courses" className="text-brand-primary hover:underline mt-4 inline-block">Browse all courses</Link>
    </div>
  );

  const waMsg = encodeURIComponent(`Hi, I'm interested in ${course.title}. Please send me more details.`);
  const waLink = `https://wa.me/${WA_NUM}?text=${waMsg}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.shortDescription,
    provider: { '@type': 'Organization', name: 'Sahlearn', sameAs: import.meta.env.VITE_SITE_URL },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO
        title={course.seoTitle || course.title}
        description={course.seoDescription || course.shortDescription}
        image={course.coverImage?.url}
        url={`/courses/${course.slug}`}
        type="article"
        jsonLd={jsonLd}
      />
      <nav className="text-sm text-ink-500 mb-6">
        <Link to="/" className="hover:text-brand-primary">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/courses" className="hover:text-brand-primary">Courses</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-900">{course.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left */}
        <div className="lg:col-span-2 space-y-8">
          {course.coverImage?.url && (
            <img
              src={course.coverImage.url}
              alt={course.title}
              fetchpriority="high"
              width={800}
              height={450}
              className="w-full rounded-xl object-cover aspect-video"
            />
          )}

          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-surface-100 text-ink-700 text-xs font-medium px-2.5 py-1 rounded-full">{course.category}</span>
              <span className="bg-surface-100 text-ink-700 text-xs font-medium px-2.5 py-1 rounded-full">{course.level}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-ink-900 font-display">{course.title}</h1>
            <p className="text-ink-500 mt-3 text-lg">{course.shortDescription}</p>
          </div>

          <div className="prose max-w-none text-ink-700">
            <p>{course.description}</p>
          </div>

          {course.whatYouLearn?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-ink-900 mb-4">What You'll Learn</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.whatYouLearn.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-ink-700 text-sm">
                    <CheckCircle2 size={18} className="text-brand-success flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {course.prerequisites?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-ink-900 mb-3">Prerequisites</h2>
              <ul className="list-disc list-inside space-y-1 text-ink-700 text-sm">
                {course.prerequisites.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
        </div>

        {/* Sticky sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-ink-300/40 shadow-sm p-6 lg:sticky lg:top-8 space-y-5">
            <div className="text-3xl font-bold text-brand-primary">{course.price}</div>

            <div className="space-y-2 text-sm text-ink-700">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-ink-500" />
                <span>{course.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart2 size={16} className="text-ink-500" />
                <span>{course.level}</span>
              </div>
            </div>

            <Link
              to={`/enroll/${course.slug}`}
              className="block w-full text-center bg-brand-primary text-white font-medium py-3 rounded-lg hover:bg-brand-primaryDark transition-colors"
            >
              Enroll Now
            </Link>

            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-ink-300 text-ink-900 font-medium py-3 rounded-lg hover:bg-surface-100 transition-colors text-sm"
            >
              <MessageCircle size={16} className="text-green-500" />
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
