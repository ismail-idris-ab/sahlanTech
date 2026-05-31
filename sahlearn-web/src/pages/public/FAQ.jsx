import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import SEO from '../../components/common/SEO';
import { getContent } from '../../services/siteContent.service';

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-ink-300/40 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-surface-50 transition-colors"
      >
        <span className="font-medium text-ink-900 pr-4">{question}</span>
        <ChevronDown
          size={18}
          className={`text-ink-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 bg-white text-ink-700 text-sm leading-relaxed border-t border-ink-300/20">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContent('faq')
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO
        title="FAQ"
        description="Frequently asked questions about Sahlearn courses, enrollment, payment, and more."
        url="/faq"
      />

      <section className="bg-white border-b border-ink-300/30 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-ink-500 mb-4">
            <Link to="/" className="hover:text-brand-primary">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-ink-900">FAQ</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-900 font-display">
            Frequently Asked Questions
          </h1>
          <p className="text-ink-500 mt-2 text-lg">
            Everything you need to know about Sahlearn.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="text-center py-16 text-ink-400">
              <p className="text-lg font-medium mb-2">No FAQs yet</p>
              <p className="text-sm">Check back soon or <Link to="/contact" className="text-brand-primary hover:underline">contact us</Link> directly.</p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="space-y-3">
              {items.map((item, i) => (
                <FaqItem key={i} question={item.question} answer={item.answer} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-ink-500 text-sm mb-4">Still have questions?</p>
            <Link
              to="/contact"
              className="inline-block px-6 py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primaryDark transition-colors text-sm"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
