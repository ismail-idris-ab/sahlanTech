import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitEnrollment } from '../../services/enrollments.service';
import { getCourseBySlug, getCourses } from '../../services/courses.service';
import SEO from '../../components/common/SEO';

const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;
const MODES = ['online', 'physical', 'hybrid'];

const EMPTY = {
  fullName: '', email: '', phone: '',
  course: '', courseTitleSnapshot: '',
  preferredStartDate: '', mode: 'online', notes: '',
};

export default function Enroll() {
  const { courseSlug } = useParams();
  const [form, setForm] = useState(EMPTY);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getCourses().then((r) => setCourses(r.data || [])).catch(() => {});
    if (courseSlug) {
      getCourseBySlug(courseSlug)
        .then((c) => setForm((f) => ({ ...f, course: c.id, courseTitleSnapshot: c.title })))
        .catch(() => {});
    }
  }, [courseSlug]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCourseChange = (e) => {
    const selected = courses.find((c) => c.id === e.target.value);
    set('course', e.target.value);
    set('courseTitleSnapshot', selected?.title || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitEnrollment(form);
      setSubmitted(true);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        data.errors.forEach((e) => toast.error(`${e.field}: ${e.message}`));
      } else {
        toast.error(data?.message || 'Submission failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const waMsg = form.courseTitleSnapshot
    ? `Hi, I'd like to enroll in "${form.courseTitleSnapshot}". Please send me more details.`
    : "Hi, I'd like to enroll in a course. Please send me details.";

  if (submitted) return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-3xl">✓</span>
      </div>
      <h1 className="text-2xl font-bold text-ink-900 mb-3">Enrollment received!</h1>
      <p className="text-ink-500 mb-6">We'll reach out to you within 24 hours to confirm your spot.</p>
      <a
        href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent(waMsg)}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
      >
        <MessageCircle size={18} /> Follow up on WhatsApp
      </a>
      <div className="mt-4">
        <Link to="/courses" className="text-brand-primary hover:underline text-sm">Browse more courses</Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <SEO
        title={form.courseTitleSnapshot ? `Enroll in ${form.courseTitleSnapshot}` : 'Enroll Now'}
        description="Sign up for a Sahlearn course. Fill in your details and we'll confirm your spot within 24 hours."
        url={courseSlug ? `/enroll/${courseSlug}` : '/enroll'}
      />
      <h1 className="text-3xl font-bold text-ink-900 font-display mb-2">Enroll Now</h1>
      <p className="text-ink-500 mb-8">Fill in your details and we'll confirm your spot.</p>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white rounded-xl border border-ink-300/40 p-6 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Full Name" required>
            <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} className={inputCls} placeholder="Amina Bello" required />
          </Field>
          <Field label="Email" required>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} placeholder="you@example.com" required />
          </Field>
        </div>

        <Field label="Phone" required>
          <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} placeholder="08012345678 or +2348012345678" required />
        </Field>

        <Field label="Course" required>
          <select value={form.course} onChange={handleCourseChange} className={inputCls} required>
            <option value="">Select a course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Preferred Start Date">
            <input type="date" value={form.preferredStartDate} onChange={(e) => set('preferredStartDate', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Mode" required>
            <select value={form.mode} onChange={(e) => set('mode', e.target.value)} className={inputCls}>
              {MODES.map((m) => <option key={m} className="capitalize">{m}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Additional Notes">
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="Any questions or special requirements..." maxLength={500} />
        </Field>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primaryDark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Enrollment'}
          </button>
          <a
            href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent(waMsg)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3 border border-ink-300 text-ink-900 font-medium rounded-lg hover:bg-surface-100 transition-colors text-sm"
          >
            <MessageCircle size={16} className="text-green-500" /> WhatsApp instead
          </a>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-ink-300 rounded-lg px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary';
