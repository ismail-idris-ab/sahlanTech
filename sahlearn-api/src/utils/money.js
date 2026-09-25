// sahlearn-api/src/utils/money.js
// Every amount in the sales feature is a whole number of naira. There are no
// kobo, so there is no floating-point drift to guard against — but percentage
// discounts do produce fractions, and those are rounded here, once, rather than
// anywhere a total is displayed.

const toInt = (v) => (Number.isFinite(v) ? Math.trunc(v) : 0);

const lineTotal = (item) => {
  const quantity = toInt(item?.quantity);
  const unitPrice = toInt(item?.unitPrice);
  if (quantity <= 0 || unitPrice < 0) return 0;
  return quantity * unitPrice;
};

// Returns non-negative integers for all three figures. A discount can never
// push the total below zero, and a negative discount can never push it above
// the subtotal.
const computeTotals = (items, discount) => {
  const list = Array.isArray(items) ? items : [];
  const subtotal = list.reduce((sum, item) => sum + lineTotal(item), 0);

  let discountAmount = 0;
  const value = Number(discount?.value);
  if (Number.isFinite(value) && value > 0) {
    discountAmount =
      discount.type === 'percent' ? Math.round((subtotal * value) / 100) : Math.round(value);
  }
  discountAmount = Math.min(Math.max(discountAmount, 0), subtotal);

  return { subtotal, discountAmount, total: subtotal - discountAmount };
};

const deriveStatus = ({ total, amountPaid, voided }) => {
  if (voided) return 'void';
  if (amountPaid >= total) return 'paid';
  if (amountPaid > 0) return 'part_paid';
  return 'unpaid';
};

module.exports = { computeTotals, lineTotal, deriveStatus };
