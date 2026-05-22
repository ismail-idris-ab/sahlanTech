import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, CreditCard, Building2, CheckCircle2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitEnrollment } from '../../services/enrollments.service';
import { getCourseBySlug, getCourses } from '../../services/courses.service';
import SEO from '../../components/common/SEO';

const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;
const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
const BANK_NAME = import.meta.env.VITE_BANK_NAME || 'First Bank of Nigeria';
const BANK_ACCOUNT = import.meta.env.VITE_BANK_ACCOUNT || '0000000000';
const BANK_ACCOUNT_NAME = import.meta.env.VITE_BANK_ACCOUNT_NAME || 'Sahlearn Education';
const MODES = ['online', 'physical', 'hybrid'];

const EMPTY = {
  fullName: '', email: '', phone: '',
  course: '', courseTitleSnapshot: '',
  preferredStartDate: '', mode: 'online', notes: '',
};

// Parse "₦50,000" or "50000" → number in Naira, 0 if free/invalid
const parsePrice = (priceStr = '') => {
  const num = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
};

export default function Enroll() {
  const { courseSlug } = useParams();
  const [form, setForm] = useState(EMPTY);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedMethod, setSubmittedMethod] = useState(null);
  const [copied, setCopied] = useState(false);

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

  const handleCourseChange = (e) => {
    const c = courses.find((c) => c.id === e.target.value);
    set('course', e.target.value);
    set('courseTitleSnapshot', c?.title || '');
    setSelectedCourse(c || null);
  };

  const doSubmit = async (extra = {}) => {
    setLoading(true);
    try {
      await submitEnrollment({ ...form, ...extra });
      setSubmittedMethod(extra.paymentMethod || paymentMethod);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (paymentMethod === 'paystack') {
      if (!PAYSTACK_KEY) {
        toast.error('Paystack is not configured. Please use bank transfer.');
        return;
      }

      const amount = parsePrice(selectedCourse?.price);
      const ref = `SAH-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      const { default: PaystackPop } = await import('@paystack/inline-js');
      const popup = new PaystackPop();
      popup.newTransaction({
        key: PAYSTACK_KEY,
        email: form.email,
        amount: amount * 100, // kobo
        currency: 'NGN',
        ref,
        metadata: {
          custom_fields: [
            { display_name: 'Course', variable_name: 'course', value: form.courseTitleSnapshot },
            { display_name: 'Student Name', variable_name: 'student_name', value: form.fullName },
          ],
        },
        onSuccess: (transaction) => {
          doSubmit({
            paymentMethod: 'paystack',
            paymentRef: transaction.reference,
            amountPaid: amount,
          });
        },
        onCancel: () => {
          toast('Payment cancelled. You can try again or use bank transfer.');
        },
      });
      return;
    }

    // Bank transfer — submit immediately, payment confirmed manually
    await doSubmit({ paymentMethod: 'bank_transfer', paymentStatus: 'pending' });
  };

  const copyAccount = () => {
    navigator.clipboard.writeText(BANK_ACCOUNT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const waMsg = form.courseTitleSnapshot
    ? `Hi, I've submitted my enrollment for "${form.courseTitleSnapshot}" and will be making a bank transfer. Please confirm my spot.`
    : "Hi, I've submitted my enrollment and will be making a bank transfer. Please confirm my spot.";

  const price = selectedCourse ? parsePrice(selectedCourse.price) : null;
  const isFree = price === 0;

  if (submitted) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <SEO title="Enrollment Submitted" description="Your enrollment has been received." url="/enroll" />
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 size={32} className="text-green-600" />
      </div>

      {submittedMethod === 'paystack' ? (
        <>
          <h1 className="text-2xl font-bold text-ink-900 mb-2">Payment successful!</h1>
          <p className="text-ink-500 mb-6">Your enrollment is confirmed. We'll contact you within 24 hours with onboarding details.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-ink-900 mb-2">Enrollment received!</h1>
          <p className="text-ink-500 mb-6">Complete your bank transfer below and we'll confirm your spot once payment clears.</p>

          {/* Bank details */}
          <div className="bg-white border border-ink-300/30 rounded-2xl p-5 text-left mb-6 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary mb-3">Transfer details</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Bank</span>
                <span className="font-medium text-ink-900">{BANK_NAME}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-500">Account No.</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink-900 font-mono tracking-widest">{BANK_ACCOUNT}</span>
                  <button onClick={copyAccount} className="text-ink-400 hover:text-brand-primary transition-colors">
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Account Name</span>
                <span className="font-medium text-ink-900">{BANK_ACCOUNT_NAME}</span>
              </div>
              {price > 0 && (
                <div className="flex justify-between pt-2 border-t border-ink-300/30">
                  <span className="text-ink-500">Amount</span>
                  <span className="font-bold text-brand-primary text-base">{selectedCourse?.price}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent(waMsg)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
        >
          <MessageCircle size={16} /> WhatsApp us
        </a>
        <Link to="/courses" className="inline-flex items-center justify-center px-6 py-3 border border-ink-300 text-ink-700 font-medium rounded-lg hover:bg-surface-100 transition-colors text-sm">
          Browse more courses
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <SEO
        title={form.courseTitleSnapshot ? `Enroll in ${form.courseTitleSnapshot}` : 'Enroll Now'}
        description="Sign up for a Sahlearn course. Pay securely via Paystack or bank transfer."
        url={courseSlug ? `/enroll/${courseSlug}` : '/enroll'}
      />
      <h1 className="text-3xl font-bold text-ink-900 font-display mb-2">Enroll Now</h1>
      <p className="text-ink-500 mb-8">Fill in your details and choose how to pay.</p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Personal details */}
        <div className="bg-white rounded-2xl border border-ink-300/40 p-6 sm:p-8 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Your details</p>

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
                <option key={c.id} value={c.id}>{c.title}{c.price ? ` — ${c.price}` : ''}</option>
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
        </div>

        {/* Payment method — only show if course has a price */}
        {!isFree && (
          <div className="bg-white rounded-2xl border border-ink-300/40 p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Payment method</p>
              {selectedCourse?.price && (
                <span className="text-lg font-bold text-brand-primary">{selectedCourse.price}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Paystack */}
              <button
                type="button"
                onClick={() => setPaymentMethod('paystack')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  paymentMethod === 'paystack'
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-ink-300/40 hover:border-ink-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  paymentMethod === 'paystack' ? 'bg-brand-primary' : 'bg-surface-100'
                }`}>
                  <CreditCard size={18} className={paymentMethod === 'paystack' ? 'text-white' : 'text-ink-500'} />
                </div>
                <div>
                  <p className="font-semibold text-ink-900 text-sm">Pay online</p>
                  <p className="text-xs text-ink-400">Card, transfer, USSD via Paystack</p>
                </div>
              </button>

              {/* Bank transfer */}
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-ink-300/40 hover:border-ink-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  paymentMethod === 'bank_transfer' ? 'bg-brand-primary' : 'bg-surface-100'
                }`}>
                  <Building2 size={18} className={paymentMethod === 'bank_transfer' ? 'text-white' : 'text-ink-500'} />
                </div>
                <div>
                  <p className="font-semibold text-ink-900 text-sm">Bank transfer</p>
                  <p className="text-xs text-ink-400">Transfer directly to our account</p>
                </div>
              </button>
            </div>

            {paymentMethod === 'bank_transfer' && (
              <div className="bg-surface-100 rounded-xl p-4 text-sm space-y-2 border border-ink-300/20">
                <p className="text-xs font-semibold text-ink-500 mb-2">Account details</p>
                <div className="flex justify-between"><span className="text-ink-500">Bank</span><span className="font-medium text-ink-900">{BANK_NAME}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-500">Account No.</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono tracking-widest text-ink-900">{BANK_ACCOUNT}</span>
                    <button type="button" onClick={copyAccount} className="text-ink-400 hover:text-brand-primary">
                      {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between"><span className="text-ink-500">Account Name</span><span className="font-medium text-ink-900">{BANK_ACCOUNT_NAME}</span></div>
                <p className="text-xs text-ink-400 pt-1">Transfer {selectedCourse?.price} then submit — we'll confirm within 24 hrs.</p>
              </div>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primaryDark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (
              paymentMethod === 'paystack' && !isFree
                ? `Pay ${selectedCourse?.price || 'now'} with Paystack`
                : 'Submit Enrollment'
            )}
          </button>
          <a
            href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent(
              form.courseTitleSnapshot
                ? `Hi, I'd like to enroll in "${form.courseTitleSnapshot}". Please send me more details.`
                : "Hi, I'd like to enroll in a course. Please send me details."
            )}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-3.5 border border-ink-300 text-ink-900 font-medium rounded-xl hover:bg-surface-100 transition-colors text-sm"
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
