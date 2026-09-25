import { formatNaira } from '../../services/receipts.service';

// Rendered identically on the admin screen and the public page. One component,
// so a change to what a receipt says cannot land in one place and not the other.
export default function ReceiptView({ receipt }) {
  if (!receipt) return null;

  return (
    <div className="bg-white rounded-2xl border border-ink-300/40 p-6 space-y-5">
      {receipt.void && (
        <p className="bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl px-4 py-2">
          This receipt has been cancelled{receipt.voidReason ? ` — ${receipt.voidReason}` : ''}.
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-400">Receipt</p>
          <p className="font-mono text-sm font-semibold text-ink-900">{receipt.receiptNo}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-400">Date</p>
          <p className="text-sm text-ink-700">
            {new Date(receipt.paidAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs text-ink-400">Received from</p>
        <p className="text-sm font-medium text-ink-900">{receipt.customerName}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-400 border-b border-ink-300/30">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 font-medium text-right">Qty</th>
              <th className="py-2 font-medium text-right">Unit</th>
              <th className="py-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-300/20">
            {receipt.items.map((item, i) => (
              <tr key={i}>
                <td className="py-2 text-ink-700">{item.description}</td>
                <td className="py-2 text-right text-ink-600">{item.quantity}</td>
                <td className="py-2 text-right text-ink-600">{formatNaira(item.unitPrice)}</td>
                <td className="py-2 text-right text-ink-900">{formatNaira(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-1 text-sm border-t border-ink-300/30 pt-3">
        <div className="flex justify-between">
          <span className="text-ink-500">Subtotal</span>
          <span>{formatNaira(receipt.subtotal)}</span>
        </div>
        {receipt.discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-ink-500">
              Discount{receipt.discountReason ? ` (${receipt.discountReason})` : ''}
            </span>
            <span>− {formatNaira(receipt.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatNaira(receipt.total)}</span>
        </div>
        <div className="flex justify-between text-brand-primary font-semibold">
          <span>Paid on this receipt</span>
          <span>{formatNaira(receipt.amountThisPayment)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-500">Paid to date</span>
          <span>{formatNaira(receipt.totalPaid)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Balance</span>
          <span>{formatNaira(receipt.balance)}</span>
        </div>
      </div>

      <p className="text-xs text-ink-400">
        Paid by {receipt.method}
        {receipt.reference ? ` · ${receipt.reference}` : ''} · Sale {receipt.saleNo}
      </p>
    </div>
  );
}
