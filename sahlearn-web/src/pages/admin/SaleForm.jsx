import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createSale, recordPayment } from '../../services/adminSales.service';
import { adminGetCourses } from '../../services/courses.service';
import { formatNaira } from '../../services/receipts.service';
import SaleItemsEditor, { emptyItem } from '../../components/admin/SaleItemsEditor';

const input =
  'w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30';
const card = 'bg-white rounded-2xl border border-ink-300/20 p-6 space-y-4 shadow-card';

export default function SaleForm() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({ fullName: '', phone: '', studentId: '' });
  const [items, setItems] = useState([emptyItem()]);
  const [discount, setDiscount] = useState({ type: 'amount', value: 0, reason: '' });
  const [opening, setOpening] = useState({ amount: 0, method: 'cash', reference: '' });
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    adminGetCourses({ limit: 100 })
      .then((res) => setCourses(res?.data || []))
      .catch(() => setCourses([])); // the picker is a convenience, not a requirement
  }, []);

  // Shown while typing. The figures that are saved come back from the server.
  const subtotal = items.reduce((sum, i) => sum + (i.quantity || 0) * (i.unitPrice || 0), 0);
  const discountAmount = Math.min(
    discount.type === 'percent'
      ? Math.round((subtotal * (Number(discount.value) || 0)) / 100)
      : Number(discount.value) || 0,
    subtotal
  );
  const total = subtotal - discountAmount;

  const validate = () => {
    const errors = {};
    if (customer.fullName.trim().length < 2) errors.fullName = 'Enter the customer name';
    if (!/^(\+234|234|0)[789][01]\d{8}$/.test(customer.phone.replace(/[\s()-]/g, ''))) {
      errors.phone = 'Enter a valid Nigerian phone number';
    }
    items.forEach((item, i) => {
      if (!item.description.trim()) errors[`item${i}`] = `Item ${i + 1} needs a description`;
      else if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        errors[`item${i}`] = `Item ${i + 1}: quantity must be 1 or more`;
      } else if (!Number.isInteger(item.unitPrice) || item.unitPrice < 0) {
        errors[`item${i}`] = `Item ${i + 1}: price must be a whole number`;
      }
    });
    if (opening.amount > total) errors.opening = 'The opening payment cannot exceed the total';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);

    let sale;
    try {
      sale = await createSale({
        fullName: customer.fullName.trim(),
        phone: customer.phone.trim(),
        ...(customer.studentId.trim() && { studentId: customer.studentId.trim() }),
        items: items.map((i) => ({
          description: i.description.trim(),
          ...(i.course && { course: i.course }),
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        ...(discountAmount > 0 && {
          discount: { type: discount.type, value: Number(discount.value), reason: discount.reason.trim() },
        }),
      });
    } catch (err) {
      const body = err.response?.data;
      if (err.response?.status === 404) setFieldErrors({ studentId: body?.message });
      else if (Array.isArray(body?.errors)) {
        setFieldErrors(body.errors.reduce((acc, e2) => ({ ...acc, [e2.field]: e2.message }), {}));
        toast.error(body.errors[0]?.message || 'Check the form');
      } else toast.error(body?.message || 'Could not save this sale');
      setSaving(false);
      return;
    }

    if (opening.amount > 0) {
      try {
        await recordPayment(sale.id, {
          amount: opening.amount,
          method: opening.method,
          ...(opening.reference.trim() && { reference: opening.reference.trim() }),
        });
      } catch (err) {
        // The sale exists. Never retry the create — send the admin to it so the
        // payment can be added there.
        toast.error(err.response?.data?.message || 'Sale saved, but the payment was not recorded');
      }
    }

    toast.success('Sale saved');
    navigate(`/admin/sales/${sale.id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl">
      <h1 className="text-2xl font-display text-ink-900">New sale</h1>

      <section className={card}>
        <h2 className="font-semibold text-ink-900">Customer</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Name</label>
            <input
              value={customer.fullName}
              onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
              className={input}
            />
            {fieldErrors.fullName && <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Phone</label>
            <input
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              placeholder="08012345678"
              className={input}
            />
            {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-ink-600 mb-1">
              Student ID{' '}
              <span className="font-normal text-ink-400">
                (optional — links this sale to their dashboard)
              </span>
            </label>
            <input
              value={customer.studentId}
              onChange={(e) => setCustomer({ ...customer, studentId: e.target.value })}
              className={input}
            />
            {fieldErrors.studentId && <p className="text-xs text-red-600 mt-1">{fieldErrors.studentId}</p>}
          </div>
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold text-ink-900">Items</h2>
        <SaleItemsEditor items={items} onChange={setItems} courses={courses} />
        {Object.keys(fieldErrors)
          .filter((k) => k.startsWith('item'))
          .map((k) => (
            <p key={k} className="text-xs text-red-600">
              {fieldErrors[k]}
            </p>
          ))}
      </section>

      <section className={card}>
        <h2 className="font-semibold text-ink-900">
          Discount <span className="font-normal text-xs text-ink-400">(optional)</span>
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <select
            value={discount.type}
            onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
            className={input}
          >
            <option value="amount">Fixed ₦</option>
            <option value="percent">Percent %</option>
          </select>
          <input
            type="number"
            min={0}
            step={1}
            value={discount.value}
            onChange={(e) => setDiscount({ ...discount, value: parseInt(e.target.value, 10) || 0 })}
            className={input}
          />
          <input
            value={discount.reason}
            onChange={(e) => setDiscount({ ...discount, reason: e.target.value })}
            placeholder="Reason, e.g. scholarship"
            className={input}
          />
        </div>
      </section>

      <section className={`${card} space-y-2`}>
        <div className="flex justify-between text-sm">
          <span className="text-ink-500">Subtotal</span>
          <span>{formatNaira(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">Discount</span>
            <span>− {formatNaira(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatNaira(total)}</span>
        </div>
        <p className="text-[11px] text-ink-400 pt-1">
          Final figures are calculated on the server when you save.
        </p>
      </section>

      <section className={card}>
        <h2 className="font-semibold text-ink-900">
          Payment now <span className="font-normal text-xs text-ink-400">(leave as 0 if nothing was paid yet)</span>
        </h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            type="number"
            min={0}
            step={1}
            value={opening.amount}
            onChange={(e) => setOpening({ ...opening, amount: parseInt(e.target.value, 10) || 0 })}
            className={input}
          />
          <select
            value={opening.method}
            onChange={(e) => setOpening({ ...opening, method: e.target.value })}
            className={input}
          >
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
            <option value="pos">POS</option>
            <option value="other">Other</option>
          </select>
          <input
            value={opening.reference}
            onChange={(e) => setOpening({ ...opening, reference: e.target.value })}
            placeholder="Reference (optional)"
            className={input}
          />
        </div>
        {fieldErrors.opening && <p className="text-xs text-red-600">{fieldErrors.opening}</p>}
      </section>

      <button
        type="submit"
        disabled={saving}
        className="px-6 py-2.5 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save sale'}
      </button>
    </form>
  );
}
