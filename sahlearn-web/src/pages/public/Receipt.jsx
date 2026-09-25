import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getReceipt } from '../../services/receipts.service';
import ReceiptView from '../../components/receipt/ReceiptView';
import ShareReceiptButtons from '../../components/receipt/ShareReceiptButtons';
import SEO from '../../components/common/SEO';

export default function Receipt() {
  const { token } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReceipt(token)
      .then(setReceipt)
      .catch((err) => setError(err.response?.data?.message || 'Receipt not found'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* A receipt is a private document that happens to be reachable by link. */}
      <SEO title="Receipt" description="Sahlearn payment receipt" noindex />
      <h1 className="text-2xl font-bold text-ink-900 font-display mb-5 print:mb-2">Payment receipt</h1>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-white rounded-2xl border border-ink-300/40 p-8 text-center">
          <p className="text-ink-700">{error}</p>
          <p className="text-sm text-ink-400 mt-2">Check the link, or ask us to send it again.</p>
        </div>
      )}

      {!loading && receipt && (
        <div className="space-y-4">
          <ReceiptView receipt={receipt} />
          <ShareReceiptButtons token={token} receiptNo={receipt.receiptNo} />
        </div>
      )}
    </div>
  );
}
