import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MessageCircle, Copy, Check, Paperclip, X,
  ChevronRight, CheckCircle2, User, CreditCard, Unlock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { submitEnrollment } from '../../services/enrollments.service';
import { getCourseBySlug, getCourses } from '../../services/courses.service';
import SEO from '../../components/common/SEO';

const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;
const BANK_NAME = import.meta.env.VITE_BANK_NAME || 'Jaiz Bank';
const BANK_ACCOUNT = import.meta.env.VITE_BANK_ACCOUNT || '0016107377';
const BANK_ACCOUNT_NAME = import.meta.env.VITE_BANK_ACCOUNT_NAME || 'Salearn Technology';
const MODES = ['online', 'physical', 'hybrid'];

const EMPTY = {
  fullName: '', email: '', phone: '',
  course: '', courseTitleSnapshot: '',
  preferredStartDate: '', mode: 'online', notes: '',
};

const inputCls = 'w-full border border-ink-300 rounded-lg px-4 py-2.5 text-ink-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-white';

export default function Enroll() {
  const { courseSlug } = useParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [copied, setCopied] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    getCourses().then((r) => setCourses(r.data || [])).catch(() => {});
    if (courseSlug) {
      getCourseBySlug(courseSlug)
        .then((c) => {
          setForm((f) => ({ ...f, course: c.id, courseTitleSnapshot: c.title }));
          setSelectedCourse(c);
        })
        .catch(() => {});
    }
  }, [courseSlug]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isFree = selectedCourse?.isFree === true;

  const handleCourseChange = (e) => {
    const c = courses.find((c) => c.id === e.target.value);
    set('course', e.target.value);
    set('courseTitleSnapshot', c?.title || '');
    setSelectedCourse(c || null);
  };

  const doSubmit = async (fd) => {
    setLoading(true);
    try {
      const res = await submitEnrollment(fd);
      setSubmitResult(res.data || null);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Step 1 → Step 2 (or direct submit for free courses)
  const handleNext = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone || !form.course) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (isFree) {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append('paymentMethod', 'free');
      await doSubmit(fd);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 submit (paid course)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    fd.append('paymentMethod', 'bank_transfer');
    if (proofFile) fd.append('paymentProof', proofFile);
    await doSubmit(fd);
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  // ── Free course success screen ─────────────────────────────────────────────
  if (submitted && submitResult?.autoConfirmed) {
    const { student, tempPassword, enrollmentCode, loginUrl } = submitResult;
    const loginPageUrl = loginUrl || '/student/login';
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <SEO title="Enrollment Confirmed" description="You're enrolled!" url="/enroll" />
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-ink-900 mb-2">You're enrolled!</h1>
          <p className="text-ink-500 text-sm">
            Your account for <strong>{form.courseTitleSnapshot}</strong> is ready.
          </p>
        </div>

        {/* Credentials card */}
        <div className="bg-ink-900 rounded-2xl p-5 text-white mb-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">Your login details</p>

          {[
            { label: 'Email', value: student?.email, key: 'email' },
            ...(tempPassword ? [{ label: 'Temp Password', value: tempPassword, key: 'pass' }] : []),
            { label: 'Enrollment Code', value: enrollmentCode, key: 'code' },
          ].map(({ label, value, key }) => (
            <div key={key} className="flex items-center justify-between bg-white/8 rounded-xl px-4 py-3">
              <div>
                <p className="text-[10px] text-ink-400 mb-0.5">{label}</p>
                <p className="font-mono text-sm font-semibold">{value}</p>
              </div>
              <button
                onClick={() => copyText(value, key)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition text-ink-400 hover:text-white"
              >
                {copied === key ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
          ))}

          {tempPassword && (
            <p className="text-[10px] text-amber-400 mt-2">Change your password after first login.</p>
          )}
        </div>

        <p className="text-xs text-ink-400 text-center mb-6">
          Login details also sent to <strong>{form.email}</strong>
        </p>

        <div className="flex flex-col gap-3">
          <a
            href={loginPageUrl}
            className="w-full py-3.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primaryDark transition-colors text-sm text-center flex items-center justify-center gap-2"
          >
            <Unlock size={15} /> Login to Student Portal
          </a>
          <Link to="/courses" className="w-full py-3 border border-ink-300 text-ink-700 font-medium rounded-xl hover:bg-surface-100 transition-colors text-sm text-center">
            Browse more courses
          </Link>
        </div>
      </div>
    );
  }

  // ── Paid course success screen ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <SEO title="Enrollment Submitted" description="Your enrollment has been received." url="/enroll" />
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-ink-900 mb-2">Enrollment submitted!</h1>
        <p className="text-ink-500 text-sm mb-2">
          We received your request for <strong>{form.courseTitleSnapshot}</strong>.
        </p>
        <p className="text-ink-400 text-sm mb-8">
          Our team will verify your payment and send your login details to <strong>{form.email}</strong> within 24 hours.
        </p>

        <div className="bg-white border border-ink-200 rounded-2xl p-5 text-left mb-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">What happens next</p>
          {[
            { n: 1, text: 'We review your enrollment and payment proof' },
            { n: 2, text: 'Our team verifies and confirms your spot' },
            { n: 3, text: 'You receive your login credentials by email' },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
              <p className="text-sm text-ink-700">{text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {WA_NUM && (
            <a
              href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent(`Hi, I just submitted my enrollment for "${form.courseTitleSnapshot}". Please confirm my spot.`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white font-medium rounded-xl hover:bg-green-600 transition-colors text-sm"
            >
              <MessageCircle size={15} /> Follow up on WhatsApp
            </a>
          )}
          <Link to="/courses" className="inline-flex items-center justify-center px-6 py-3 border border-ink-300 text-ink-700 font-medium rounded-xl hover:bg-surface-100 transition-colors text-sm">
            Browse more courses
          </Link>
        </div>
      </div>
    );
  }

  // ── Step indicator ─────────────────────────────────────────────────────────
  const steps = isFree
    ? [{ n: 1, label: 'Your Details', icon: User }]
    : [
        { n: 1, label: 'Your Details', icon: User },
        { n: 2, label: 'Payment', icon: CreditCard },
      ];

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <SEO
        title={form.courseTitleSnapshot ? `Enroll in ${form.courseTitleSnapshot}` : 'Enroll Now'}
        description="Sign up for a Sahlearn course."
        url={courseSlug ? `/enroll/${courseSlug}` : '/enroll'}
      />

      <h1 className="text-3xl font-bold text-ink-900 font-display mb-6">
        {isFree ? 'Enroll for Free' : 'Enroll Now'}
      </h1>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map(({ n, label, icon: Icon }, i) => (
          <div key={n} className="flex items-center flex-1">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step === n ? 'bg-brand-primary text-white' : step > n ? 'bg-green-500 text-white' : 'bg-surface-200 text-ink-400'
              }`}>
                {step > n ? <Check size={14} /> : n}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${step === n ? 'text-ink-900' : 'text-ink-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${step > 1 ? 'bg-green-400' : 'bg-surface-200'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Free course info banner */}
      {isFree && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6">
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800 font-medium">This course is free — no payment needed. Your account will be created instantly.</p>
        </div>
      )}

      {/* ── Step 1: Personal Details ── */}
      {step === 1 && (
        <form onSubmit={handleNext} className="space-y-5">
          <div className="bg-white rounded-2xl border border-ink-300/40 p-6 sm:p-8 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Your details</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Full Name" required>
                <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)}
                  className={inputCls} placeholder="Amina Bello" required />
              </Field>
              <Field label="Email" required>
                <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  className={inputCls} placeholder="you@example.com" required />
              </Field>
            </div>

            <Field label="Phone" required>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                className={inputCls} placeholder="08012345678 or +2348012345678" required />
            </Field>

            <Field label="Course" required>
              <select value={form.course} onChange={handleCourseChange} className={inputCls} required>
                <option value="">Select a course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}{c.isFree ? ' — Free' : c.price ? ` — ${c.price}` : ''}
                  </option>
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
              <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
                className={`${inputCls} resize-none`} rows={3}
                placeholder="Any questions or special requirements..." maxLength={500} />
            </Field>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${
              isFree ? 'bg-green-600 hover:bg-green-700' : 'bg-brand-primary hover:bg-brand-primaryDark'
            }`}
          >
            {loading ? 'Submitting...' : isFree ? 'Enroll for Free' : <>Continue to Payment <ChevronRight size={16} /></>}
          </button>
        </form>
      )}

      {/* ── Step 2: Payment (paid courses only) ── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Summary */}
          <div className="bg-white rounded-2xl border border-ink-300/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-3">Enrollment summary</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Name</span>
                <span className="font-medium text-ink-900">{form.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Course</span>
                <span className="font-medium text-ink-900 text-right max-w-[60%]">{form.courseTitleSnapshot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Mode</span>
                <span className="capitalize text-ink-700">{form.mode}</span>
              </div>
              {selectedCourse?.price && (
                <div className="flex justify-between pt-2 border-t border-ink-100 mt-2">
                  <span className="text-ink-500 font-medium">Amount</span>
                  <span className="font-bold text-brand-primary text-base">{selectedCourse.price}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bank details */}
          <div className="bg-white rounded-2xl border border-ink-300/40 p-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Transfer payment to</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2.5 border-b border-ink-100">
                <span className="text-ink-500">Bank</span>
                <span className="font-semibold text-ink-900">{BANK_NAME}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-ink-100">
                <span className="text-ink-500">Account No.</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold font-mono tracking-widest text-ink-900 text-base">{BANK_ACCOUNT}</span>
                  <button type="button" onClick={() => copyText(BANK_ACCOUNT, 'acct')}
                    className="p-1.5 rounded-lg text-ink-400 hover:text-brand-primary hover:bg-brand-primary/8 transition-all" title="Copy">
                    {copied === 'acct' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-ink-500">Account Name</span>
                <span className="font-semibold text-ink-900">{BANK_ACCOUNT_NAME}</span>
              </div>
            </div>
            <p className="text-xs text-ink-400 bg-surface-100 rounded-lg px-3 py-2">
              Transfer the exact amount, then attach your receipt below. We verify and send login details within 24 hours.
            </p>
          </div>

          {/* Receipt upload */}
          <div className="bg-white rounded-2xl border border-ink-300/40 p-6 space-y-3">
            <div>
              <p className="text-sm font-medium text-ink-900 mb-0.5">Attach payment receipt</p>
              <p className="text-xs text-ink-400">Screenshot or PDF of your transfer — helps us confirm faster</p>
            </div>
            {proofFile ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Paperclip size={14} className="text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{proofFile.name}</p>
                  <p className="text-xs text-ink-400">{(proofFile.size / 1024).toFixed(0)} KB</p>
                </div>
                <button type="button" onClick={() => { setProofFile(null); fileRef.current.value = ''; }}
                  className="text-ink-400 hover:text-red-500 transition-colors p-1">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-ink-200 rounded-xl text-ink-400 hover:border-brand-primary hover:text-brand-primary transition-colors">
                <Paperclip size={20} />
                <span className="text-sm">Click to attach receipt</span>
                <span className="text-xs">JPG, PNG or PDF — max 10MB</span>
              </button>
            )}
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)}
              className="px-5 py-3.5 border border-ink-300 text-ink-700 font-medium rounded-xl hover:bg-surface-100 transition-colors text-sm">
              Back
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primaryDark transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Submitting...' : 'Submit Enrollment'}
            </button>
          </div>
        </form>
      )}
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
