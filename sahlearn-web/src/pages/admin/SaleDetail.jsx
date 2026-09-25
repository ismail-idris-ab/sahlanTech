import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getSale, recordPayment, voidPayment, voidSale } from '../../services/adminSales.service';
import { formatNaira } from '../../services/receipts.service';
import ShareReceiptButtons from '../../components/receipt/ShareReceiptButtons';

const input =
  'w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30';
const card = 'bg-white rounded-2xl border border-ink-300/20 p-6 shadow-card';

const STATUS_STYLES = {
  unpaid: 'bg-red-50 text-red-700',
  part_paid: 'bg-amber-50 text-amber-700',
  paid: 'bg-green-50 text-green-700',
  void: 'bg-surface-100 text-ink-500',
};
const STATUS_LABEL = { unpaid: 'Unpaid', part_paid: 'Part paid', paid: 'Paid', void: 'Void' };

export default function SaleDetail() {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ amount: 0, method: 'cash', reference: '' });
  const [amountError, setAmountError] = useState('');

  const load = useCallback(async () => {
    try {
      setSale(await getSale(id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load this sale');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePay = async (e) => {
    e.preventDefault();
    setAmountError('');
    if (saving) return;
    if (!Number.isInteger(form.amount) || form.amount < 1) {
      setAmountError('Enter a whole number of naira');
      return;
    }
    setSaving(true);
    try {
      const { payment } = await recordPayment(id, {
        amount: form.amount,
        method: form.method,
        ...(form.reference.trim() && { reference: form.reference.trim() }),
      });
      toast.success(`Receipt ${payment.receiptNo} issued`);
      setForm({ amount: 0, method: 'cash', reference: '' });
      await load();
    } catch (err) {
      const body = err.response?.data;
      if (err.response?.status === 422) setAmountError(body?.errors?.[0]?.message || body?.message);
      else toast.error(body?.message || 'Could not record this payment');
    } finally {
      setSaving(false);
    }
  };

  const handleVoidPayment = async (payment) => {
    const reason = window.prompt(`Why is receipt ${payment.receiptNo} being cancelled?`);
    if (!reason?.trim()) return;
    try {
      await voidPayment(payment.id, reason.trim());
      toast.success('Receipt voided');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not void this receipt');
    }
  };

  const handleVoidSale = async () => {
    const reason = window.prompt('Why is this sale being cancelled?');
    if (!reason?.trim()) return;
    try {
      await voidSale(id, reason.trim());
      toast.success('Sale voided');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not void this sale');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!sale) return null;

  const isVoid = sale.status === 'void';
  const canPay = !isVoid && sale.balance > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 text-xs text-ink-400">
        <Link to="/admin/sales" className="hover:text-ink-900 transition">
          Sales
        </Link>
        <span>›</span>
        <span className="font-semibold" style={{ color: '#068562' }}>
          {sale.saleNo}
        </span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">{sale.customer?.fullName}</h1>
          <p className="text-xs text-ink-400 mt-0.5">
            <span className="font-mono">{sale.customer?.phone}</span> · {sale.saleNo}
            {sale.customer?.student ? ' · student' : ' · guest'}
          </p>
        </div>
        <div className="text-right">
          <span
            className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_STYLES[sale.status]}`}
          >
            {STATUS_LABEL[sale.status]}
          </span>
          <p className="text-2xl font-semibold text-ink-900 mt-1">{formatNaira(sale.balance)}</p>
          <p className="text-xs text-ink-400">outstanding of {formatNaira(sale.total)}</p>
        </div>
      </div>

      {isVoid && (
        <p className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2">
          This sale was cancelled{sale.voidReason ? ` — ${sale.voidReason}` : ''}.
        </p>
      )}

      <section className={card}>
        <h2 className="font-semibold text-ink-900 mb-3">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-surface-100">
              {sale.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2 text-ink-700">{item.description}</td>
                  <td className="py-2 text-right text-ink-500">
                    {item.quantity} × {formatNaira(item.unitPrice)}
                  </td>
                  <td className="py-2 text-right text-ink-900 font-medium">{formatNaira(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-surface-200 mt-3 pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-500">Subtotal</span>
            <span>{formatNaira(sale.subtotal)}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-ink-500">
                Discount{sale.discount?.reason ? ` (${sale.discount.reason})` : ''}
              </span>
              <span>− {formatNaira(sale.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatNaira(sale.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">Paid</span>
            <span>{formatNaira(sale.amountPaid)}</span>
          </div>
        </div>
      </section>

      {canPay && (
        <section className={card}>
          <h2 className="font-semibold text-ink-900 mb-3">Record a payment</h2>
          <form onSubmit={handlePay} className="grid sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Amount (₦)</label>
              <input
                type="number"
                min={1}
                step={1}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value, 10) || 0 })}
                className={input}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Method</label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className={input}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="pos">POS</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Reference</label>
              <input
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                className={input}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Record'}
              </button>
            </div>
          </form>
          {amountError && <p className="text-xs text-red-600 mt-2">{amountError}</p>}
          <p className="text-xs text-ink-400 mt-2">
            Outstanding balance {formatNaira(sale.balance)}. A larger amount will be refused.
          </p>
        </section>
      )}

      <section className={card}>
        <h2 className="font-semibold text-ink-900 mb-3">Receipts</h2>
        {sale.payments.length === 0 ? (
          <p className="text-sm text-ink-500">No payments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {sale.payments.map((p) => (
              <div key={p.id} className="border border-surface-200 rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className={`font-mono text-sm ${p.voidedAt ? 'line-through text-ink-400' : 'text-ink-900'}`}>
                      {p.receiptNo}
                    </p>
                    <p className="text-xs text-ink-400">
                      {new Date(p.paidAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })} · {p.method}
                      {p.reference ? ` · ${p.reference}` : ''}
                    </p>
                    {p.voidedAt && (
                      <p className="text-xs text-red-600 mt-1">Voided{p.voidReason ? ` — ${p.voidReason}` : ''}</p>
                    )}
                  </div>
                  <p className={`text-sm font-semibold ${p.voidedAt ? 'line-through text-ink-400' : 'text-ink-900'}`}>
                    {formatNaira(p.amount)}
                  </p>
                </div>

                {!p.voidedAt && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <ShareReceiptButtons
                      token={p.publicToken}
                      receiptNo={p.receiptNo}
                      phone={sale.customer?.phone}
                    />
                    <button
                      type="button"
                      onClick={() => handleVoidPayment(p)}
                      className="px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition"
                    >
                      Void
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {!isVoid && (
        <button
          type="button"
          onClick={handleVoidSale}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition"
        >
          Void this sale
        </button>
      )}
    </div>
  );
}
