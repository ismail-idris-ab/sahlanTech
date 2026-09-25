import { useState } from 'react';
import { Printer, Download, Share2, MessageCircle } from 'lucide-react';
import { receiptPdfUrl, whatsappShareUrl } from '../../services/receipts.service';

// Sharing a FILE is not supported everywhere, so the button only appears where
// it will actually work rather than failing when pressed.
const probeFileSharing = () => {
  try {
    const probe = new File(['probe'], 'probe.pdf', { type: 'application/pdf' });
    return Boolean(navigator.canShare?.({ files: [probe] }));
  } catch {
    return false;
  }
};

export default function ShareReceiptButtons({ token, receiptNo, phone }) {
  // Lazy initializer, not an effect: the answer cannot change while mounted.
  const [canShareFiles] = useState(probeFileSharing);

  const shareFile = async () => {
    try {
      const res = await fetch(receiptPdfUrl(token));
      const blob = await res.blob();
      const file = new File([blob], `${receiptNo.replace(/\//g, '-')}.pdf`, { type: 'application/pdf' });
      await navigator.share({ files: [file], title: `Receipt ${receiptNo}` });
    } catch {
      // A cancelled share sheet throws too, so this stays silent on purpose.
    }
  };

  const btn = 'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition';

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button type="button" onClick={() => window.print()} className={`${btn} bg-surface-100 text-ink-700 hover:bg-surface-200`}>
        <Printer size={14} /> Print
      </button>
      <a href={receiptPdfUrl(token)} className={`${btn} bg-surface-100 text-ink-700 hover:bg-surface-200`}>
        <Download size={14} /> PDF
      </a>
      {phone && (
        <a
          href={whatsappShareUrl(phone, token, receiptNo)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btn} bg-green-50 text-green-700 hover:bg-green-100`}
        >
          <MessageCircle size={14} /> WhatsApp
        </a>
      )}
      {canShareFiles && (
        <button type="button" onClick={shareFile} className={`${btn} bg-surface-100 text-ink-700 hover:bg-surface-200`}>
          <Share2 size={14} /> Share
        </button>
      )}
    </div>
  );
}
