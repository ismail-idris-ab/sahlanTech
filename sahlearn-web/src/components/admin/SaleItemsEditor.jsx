import { Plus, Trash2 } from 'lucide-react';
import { formatNaira } from '../../services/receipts.service';

export const emptyItem = () => ({ description: '', course: null, quantity: 1, unitPrice: 0 });

const MAX_ITEMS = 20;

export default function SaleItemsEditor({ items, onChange, courses = [] }) {
  const update = (i, patch) => onChange(items.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  const add = () => items.length < MAX_ITEMS && onChange([...items, emptyItem()]);
  const remove = (i) => items.length > 1 && onChange(items.filter((_, idx) => idx !== i));

  // Picking a course fills the description only. The price is typed, because
  // Course.price is free text like "₦50,000" and parsing money out of a text
  // field is how a ₦50,000 course gets sold for ₦50.
  const pickCourse = (i, courseId) => {
    const course = courses.find((c) => c.id === courseId);
    update(i, course ? { course: course.id, description: course.title } : { course: null });
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-surface-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <span className="text-xs font-medium text-ink-500">Item {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={items.length <= 1}
              className="p-1 rounded-lg hover:bg-red-50 text-ink-300 hover:text-red-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label={`Remove item ${i + 1}`}
            >
              <Trash2 size={14} />
            </button>
          </div>

          {courses.length > 0 && (
            <select
              value={item.course || ''}
              onChange={(e) => pickCourse(i, e.target.value)}
              className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="">Type your own description, or pick a course…</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}

          <input
            value={item.description}
            onChange={(e) => update(i, { description: e.target.value })}
            placeholder="Description, e.g. HP EliteBook 840 G5"
            className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Quantity</label>
              <input
                type="number"
                min={1}
                step={1}
                value={item.quantity}
                onChange={(e) => update(i, { quantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Unit price (₦)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={item.unitPrice}
                onChange={(e) => update(i, { unitPrice: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>

          <p className="text-xs text-ink-400 text-right">
            Line total {formatNaira((item.quantity || 0) * (item.unitPrice || 0))}
          </p>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        disabled={items.length >= MAX_ITEMS}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-surface-100 text-ink-700 rounded-xl hover:bg-surface-200 transition disabled:opacity-40"
      >
        <Plus size={13} /> Add item
      </button>
    </div>
  );
}
