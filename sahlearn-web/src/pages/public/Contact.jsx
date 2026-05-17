import { useState } from 'react';
import { MessageCircle, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitContact } from '../../services/contact.service';
import SEO from '../../components/common/SEO';

const WA_NUM = import.meta.env.VITE_WHATSAPP_NUMBER;

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitContact(form);
      setSubmitted(true);
      setForm(EMPTY);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.length) {
        data.errors.forEach((e) => toast.error(`${e.field}: ${e.message}`));
      } else {
        toast.error(data?.message || 'Failed to send message. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const waLink = `https://wa.me/${WA_NUM}?text=${encodeURIComponent("Hi Sahlearn, I'd like to get in touch.")}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO title="Contact" description="Get in touch with Sahlearn via our contact form or WhatsApp." url="/contact" />
      <h1 className="text-3xl md:text-4xl font-bold text-ink-900 font-display mb-2">Contact Us</h1>
      <p className="text-ink-500 mb-10">Send a message or reach out directly on WhatsApp.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Form */}
        <div className="lg:col-span-2">
          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-ink-900 mb-2">Message sent!</h2>
              <p className="text-ink-500 text-sm">We'll get back to you within 24 hours.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 text-brand-primary hover:underline text-sm"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Full Name" required>
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} placeholder="Amina Bello" required />
                </Field>
                <Field label="Email" required>
                  <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputCls} placeholder="you@example.com" required />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Phone (optional)">
                  <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} placeholder="08012345678" />
                </Field>
                <Field label="Subject" required>
                  <input value={form.subject} onChange={(e) => set('subject', e.target.value)} className={inputCls} placeholder="Course enquiry" required />
                </Field>
              </div>

              <Field label="Message" required>
                <textarea
                  value={form.message}
                  onChange={(e) => set('message', e.target.value)}
                  className={`${inputCls} resize-none`}
                  rows={5}
                  placeholder="Tell us how we can help..."
                  required
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primaryDark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        {/* Info sidebar */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-ink-300/40 p-6 space-y-4">
            <h2 className="font-semibold text-ink-900">Get in touch</h2>

            <a href={waLink} target="_blank" rel="noreferrer" className="flex items-start gap-3 group">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-900 group-hover:text-brand-primary transition-colors">WhatsApp</p>
                <p className="text-xs text-ink-500">{WA_NUM}</p>
              </div>
            </a>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-brand-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-900">Email</p>
                <p className="text-xs text-ink-500">hello@sahlearn.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-brand-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-900">Response time</p>
                <p className="text-xs text-ink-500">Within 24 hours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
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
