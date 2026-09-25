# Sales & Receipts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the admin record a sale, take payment in full or in instalments, and issue a numbered receipt the customer can print, download or receive on WhatsApp.

**Architecture:** Two collections. `Sale` owns what was bought and what it costs; `Payment` owns each sum of money received and carries its own receipt number. Every money figure — subtotal, discount, total, amount paid, balance — is computed on the server from the stored rows and never accepted from the client. Balance is recomputed from the surviving payments after every change, never incremented or decremented.

**Tech Stack:** Express 4, Mongoose 9, express-validator, express-rate-limit, PDFKit (already present in `sahlearn-api/src/utils/pdf.js`), React 19 + Vite, Tailwind 3, React Router 7.

**Spec:** `docs/superpowers/specs/2026-09-25-sales-receipts-design.md`

## Global Constraints

- Stack is fixed by `CLAUDE.md` §4. Do not add libraries. PDFKit, express-validator, express-rate-limit and `crypto` are already available.
- Success envelope `{ status: 'success', data }`; lists add `meta: { page, limit, total, totalPages }`; errors `{ status: 'error', message }` plus `errors: [{ field, message }]` on 422. Use `success`, `successList`, `notFound` from `src/utils/apiResponse.js` and the `validate` middleware from `src/middleware/validate.js`.
- **All money is whole naira integers.** No decimals anywhere — validators reject non-integers. There are no kobo.
- **The client never sends a total.** `subtotal`, `discountAmount`, `total`, `amountPaid` and `balance` in a request body are ignored, never trusted.
- Admin routes use `authMiddleware` from `src/middleware/auth.js`, which already enforces `role === 'admin'` and sets `req.user`. Student routes use `src/middleware/studentAuth.js`, which sets `req.student`.
- **Mount order matters.** In `src/app.js`, specific sub-routes mount ABOVE the generic `/api/student` (line 125) and `/api/admin` (line 136) routers, exactly as `/api/admin/daily-quizzes` does at line 135. Getting this wrong makes every new route 404.
- Dates shown to people are Africa/Lagos. Reuse `lagosDateKey` from `src/utils/dateKey.js` where a date key is needed; never `toISOString().slice(0,10)`.
- Sequential numbers reuse the `Counter` model and the `nextSeq` pattern already in `src/controllers/enrollments.controller.js:15-22`.
- Backend tests are Jest + supertest under `sahlearn-api/tests/`, run with `npx jest`. `tests/setup.js` connects an in-memory MongoDB and calls `syncIndexes()` on every model, so unique indexes are live in tests.
- Frontend: components never call axios directly — every call goes through a file in `src/services/`. Mobile-first Tailwind. One `<h1>` per page.
- Commit after every task with a conventional-commit message.

## Review Focus

These are the failure modes the spec implies but does not spell out. Each one has its test pinned to the task that owns the code.

1. **A discount larger than the subtotal** — a ₦10,000 discount on a ₦5,000 sale must floor the total at zero, never go negative. (Task 1)
2. **Non-integer or negative quantity, price or payment** — `1.5`, `-100`, `"abc"`, `1e9` must return 422, never a 500 from Mongoose casting. (Tasks 5, 7)
3. **Two payments recorded at the same moment** — the receipt counter must not hand out the same number twice. (Task 7)
4. **A client that sends its own `total` or `balance`** — must be ignored, with the server's figure stored. (Task 5)
5. **A malformed or unknown receipt token** — `/api/receipts/not-a-token` must 404 with a generic message, never 500 on a cast. (Task 9)

---

## File Structure

**Backend — create:**
- `src/utils/money.js` — pure total arithmetic, no database
- `src/utils/docNumber.js` — sequential `SAH/S/2026/0001` and `SAH/R/2026/0001`
- `src/models/Sale.js`, `src/models/Payment.js`
- `src/services/sales.service.js` — the one place a sale's totals are recomputed
- `src/controllers/admin.sales.controller.js`, `src/controllers/receipts.controller.js`, `src/controllers/student.receipts.controller.js`
- `src/routes/admin.sales.routes.js`, `src/routes/receipts.routes.js`, `src/routes/student.receipts.routes.js`

**Backend — modify:**
- `src/utils/pdf.js` — add `generateReceipt`, reusing the private `drawHeader`/`tableRow` helpers already in the file
- `src/middleware/rateLimit.js` — two public receipt limiters
- `src/app.js` — mount three routers, respecting the order rule

**Frontend — create:**
- `src/services/adminSales.service.js`, `src/services/receipts.service.js`
- `src/pages/admin/Sales.jsx`, `SaleForm.jsx`, `SaleDetail.jsx`
- `src/components/admin/SaleItemsEditor.jsx`
- `src/components/receipt/ReceiptView.jsx` — shared by admin and the public page so they cannot drift
- `src/components/receipt/ShareReceiptButtons.jsx`
- `src/pages/public/Receipt.jsx`, `src/pages/student/Payments.jsx`

**Frontend — modify:**
- `src/routes/AppRouter.jsx` — admin, public and student routes
- `src/components/layout/AdminLayout.jsx` — a Sales entry in the nav

---

### Task 1: Money arithmetic

Pure functions, no database. Everything downstream depends on these being right.

**Files:**
- Create: `sahlearn-api/src/utils/money.js`
- Test: `sahlearn-api/tests/unit/money.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `computeTotals(items, discount) -> { subtotal, discountAmount, total }` where `items` is `[{ quantity, unitPrice }]` and `discount` is `{ type: 'amount'|'percent', value }` or null/undefined. All returned values are non-negative integers.
  - `lineTotal(item) -> number`
  - `deriveStatus({ total, amountPaid, voided }) -> 'void'|'paid'|'part_paid'|'unpaid'`

- [ ] **Step 1: Write the failing test**

```js
// sahlearn-api/tests/unit/money.test.js
const { computeTotals, lineTotal, deriveStatus } = require('../../src/utils/money');

describe('lineTotal', () => {
  test('multiplies quantity by unit price', () => {
    expect(lineTotal({ quantity: 3, unitPrice: 2500 })).toBe(7500);
  });

  test('treats missing or junk values as zero rather than NaN', () => {
    expect(lineTotal({})).toBe(0);
    expect(lineTotal({ quantity: 'two', unitPrice: 100 })).toBe(0);
    expect(lineTotal(null)).toBe(0);
  });
});

describe('computeTotals', () => {
  const items = [
    { quantity: 1, unitPrice: 185000 },
    { quantity: 2, unitPrice: 2500 },
  ];

  test('sums the lines when there is no discount', () => {
    expect(computeTotals(items, null)).toEqual({
      subtotal: 190000,
      discountAmount: 0,
      total: 190000,
    });
  });

  test('applies a fixed discount', () => {
    expect(computeTotals(items, { type: 'amount', value: 10000 })).toEqual({
      subtotal: 190000,
      discountAmount: 10000,
      total: 180000,
    });
  });

  test('applies a percentage discount and rounds to whole naira', () => {
    // 10% of 190000 = 19000 exactly
    expect(computeTotals(items, { type: 'percent', value: 10 })).toEqual({
      subtotal: 190000,
      discountAmount: 19000,
      total: 171000,
    });
    // 7.5% of 5000 = 375
    expect(computeTotals([{ quantity: 1, unitPrice: 5000 }], { type: 'percent', value: 7.5 })).toEqual({
      subtotal: 5000,
      discountAmount: 375,
      total: 4625,
    });
  });

  // Review Focus 1
  test('a discount larger than the subtotal floors the total at zero', () => {
    expect(computeTotals([{ quantity: 1, unitPrice: 5000 }], { type: 'amount', value: 10000 })).toEqual({
      subtotal: 5000,
      discountAmount: 5000,
      total: 0,
    });
  });

  test('a percentage above 100 floors the total at zero', () => {
    expect(computeTotals([{ quantity: 1, unitPrice: 5000 }], { type: 'percent', value: 150 })).toEqual({
      subtotal: 5000,
      discountAmount: 5000,
      total: 0,
    });
  });

  test('a negative discount is ignored rather than inflating the total', () => {
    expect(computeTotals([{ quantity: 1, unitPrice: 5000 }], { type: 'amount', value: -1000 })).toEqual({
      subtotal: 5000,
      discountAmount: 0,
      total: 5000,
    });
  });

  test('an empty or junk item list totals zero', () => {
    for (const bad of [[], null, undefined, 'items', {}]) {
      expect(computeTotals(bad, null)).toEqual({ subtotal: 0, discountAmount: 0, total: 0 });
    }
  });

  test('every returned figure is a whole number', () => {
    const { subtotal, discountAmount, total } = computeTotals(
      [{ quantity: 3, unitPrice: 3333 }],
      { type: 'percent', value: 33 }
    );
    for (const n of [subtotal, discountAmount, total]) {
      expect(Number.isInteger(n)).toBe(true);
    }
  });
});

describe('deriveStatus', () => {
  test('void beats everything', () => {
    expect(deriveStatus({ total: 100, amountPaid: 100, voided: true })).toBe('void');
  });

  test('unpaid, part paid and paid', () => {
    expect(deriveStatus({ total: 1000, amountPaid: 0 })).toBe('unpaid');
    expect(deriveStatus({ total: 1000, amountPaid: 400 })).toBe('part_paid');
    expect(deriveStatus({ total: 1000, amountPaid: 1000 })).toBe('paid');
  });

  test('a zero-total sale counts as paid', () => {
    expect(deriveStatus({ total: 0, amountPaid: 0 })).toBe('paid');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sahlearn-api && npx jest tests/unit/money.test.js`
Expected: FAIL — `Cannot find module '../../src/utils/money'`

- [ ] **Step 3: Write the implementation**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd sahlearn-api && npx jest tests/unit/money.test.js`
Expected: PASS, 11 tests

- [ ] **Step 5: Commit**

```bash
git add sahlearn-api/src/utils/money.js sahlearn-api/tests/unit/money.test.js
git commit -m "feat(sales): add money arithmetic helpers"
```

---

### Task 2: Sequential document numbers

**Files:**
- Create: `sahlearn-api/src/utils/docNumber.js`
- Test: `sahlearn-api/tests/unit/docNumber.test.js`

**Interfaces:**
- Consumes: the existing `Counter` model at `src/models/Counter.js` (`{ _id: String, seq: Number }`).
- Produces:
  - `nextSaleNo() -> Promise<string>` e.g. `'SAH/S/2026/0001'`
  - `nextReceiptNo() -> Promise<string>` e.g. `'SAH/R/2026/0001'`

- [ ] **Step 1: Write the failing test**

```js
// sahlearn-api/tests/unit/docNumber.test.js
const { nextSaleNo, nextReceiptNo } = require('../../src/utils/docNumber');
const { lagosDateKey } = require('../../src/utils/dateKey');

const year = () => lagosDateKey().slice(0, 4);

describe('document numbers', () => {
  test('sale numbers start at 0001 and carry the Lagos year', async () => {
    expect(await nextSaleNo()).toBe(`SAH/S/${year()}/0001`);
    expect(await nextSaleNo()).toBe(`SAH/S/${year()}/0002`);
  });

  test('receipt numbers run on their own sequence', async () => {
    await nextSaleNo();
    expect(await nextReceiptNo()).toBe(`SAH/R/${year()}/0001`);
  });

  // Review Focus 3 — the counter is the only thing standing between two
  // simultaneous payments and a duplicate receipt number.
  test('concurrent calls never hand out the same number', async () => {
    const numbers = await Promise.all(Array.from({ length: 25 }, () => nextReceiptNo()));
    expect(new Set(numbers).size).toBe(25);
  });

  test('numbers are zero-padded to four digits and keep growing past 9999', async () => {
    const Counter = require('../../src/models/Counter');
    await Counter.findByIdAndUpdate(`receipt-${year()}`, { seq: 9999 }, { upsert: true });
    expect(await nextReceiptNo()).toBe(`SAH/R/${year()}/10000`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sahlearn-api && npx jest tests/unit/docNumber.test.js`
Expected: FAIL — `Cannot find module '../../src/utils/docNumber'`

- [ ] **Step 3: Write the implementation**

```js
// sahlearn-api/src/utils/docNumber.js
// Sequential, human-readable document numbers. Same Counter pattern as the
// enrollment codes in controllers/enrollments.controller.js.
//
// findOneAndUpdate with $inc is atomic in MongoDB, so two requests arriving at
// the same instant get different numbers. Nothing else in this feature
// guarantees that.
const Counter = require('../models/Counter');
const { lagosDateKey } = require('./dateKey');

const nextSeq = async (key) => {
  const doc = await Counter.findByIdAndUpdate(key, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return doc.seq;
};

// The year restarts the sequence each January and is visible in the number, so
// 'SAH/R/2026/0007' is unambiguous forever.
const currentYear = () => lagosDateKey().slice(0, 4);

const nextSaleNo = async () => {
  const year = currentYear();
  const seq = await nextSeq(`sale-${year}`);
  return `SAH/S/${year}/${String(seq).padStart(4, '0')}`;
};

const nextReceiptNo = async () => {
  const year = currentYear();
  const seq = await nextSeq(`receipt-${year}`);
  return `SAH/R/${year}/${String(seq).padStart(4, '0')}`;
};

module.exports = { nextSaleNo, nextReceiptNo };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd sahlearn-api && npx jest tests/unit/docNumber.test.js`
Expected: PASS, 4 tests

- [ ] **Step 5: Commit**

```bash
git add sahlearn-api/src/utils/docNumber.js sahlearn-api/tests/unit/docNumber.test.js
git commit -m "feat(sales): add sequential sale and receipt numbering"
```

---

### Task 3: Sale and Payment models

Both models together: they are two halves of one shape and a reviewer would judge them as one.

**Files:**
- Create: `sahlearn-api/src/models/Sale.js`, `sahlearn-api/src/models/Payment.js`
- Test: `sahlearn-api/tests/unit/sale.model.test.js`

**Interfaces:**
- Consumes: `computeTotals`, `deriveStatus` from `src/utils/money.js`.
- Produces: Mongoose models `Sale` and `Payment` with the fields below. `Sale` recomputes `subtotal`, `discountAmount`, `total`, `balance` and `status` in a `pre('validate')` hook from `items`, `discount` and its current `amountPaid`. `Payment.publicToken` defaults to 32 random hex characters.

- [ ] **Step 1: Write the failing test**

```js
// sahlearn-api/tests/unit/sale.model.test.js
const Sale = require('../../src/models/Sale');
const Payment = require('../../src/models/Payment');

const baseSale = (overrides = {}) => ({
  saleNo: 'SAH/S/2026/0001',
  customer: { fullName: 'Musa Ibrahim', phone: '08012345678' },
  items: [{ description: 'HP EliteBook', quantity: 1, unitPrice: 185000 }],
  ...overrides,
});

describe('Sale model', () => {
  test('computes line totals, subtotal and total on save', async () => {
    const sale = await Sale.create(
      baseSale({ items: [{ description: 'Textbook', quantity: 3, unitPrice: 2500 }] })
    );
    expect(sale.items[0].lineTotal).toBe(7500);
    expect(sale.subtotal).toBe(7500);
    expect(sale.total).toBe(7500);
    expect(sale.balance).toBe(7500);
    expect(sale.status).toBe('unpaid');
  });

  test('applies the discount and recomputes the balance', async () => {
    const sale = await Sale.create(baseSale({ discount: { type: 'percent', value: 10 } }));
    expect(sale.discountAmount).toBe(18500);
    expect(sale.total).toBe(166500);
  });

  test('status follows amountPaid', async () => {
    const sale = await Sale.create(baseSale());
    sale.amountPaid = 100000;
    await sale.save();
    expect(sale.status).toBe('part_paid');
    expect(sale.balance).toBe(85000);

    sale.amountPaid = 185000;
    await sale.save();
    expect(sale.status).toBe('paid');
    expect(sale.balance).toBe(0);
  });

  test('a voided sale reports status void whatever the balance', async () => {
    const sale = await Sale.create(baseSale({ voidedAt: new Date(), voidReason: 'wrong customer' }));
    expect(sale.status).toBe('void');
  });

  test('requires at least one item and refuses more than twenty', async () => {
    await expect(Sale.create(baseSale({ items: [] }))).rejects.toThrow(/at least one item/i);
    const many = Array.from({ length: 21 }, () => ({ description: 'x', quantity: 1, unitPrice: 1 }));
    await expect(Sale.create(baseSale({ items: many }))).rejects.toThrow(/more than 20/i);
  });

  test('refuses a duplicate saleNo', async () => {
    await Sale.create(baseSale());
    await expect(Sale.create(baseSale())).rejects.toThrow(/duplicate key/i);
  });

  test('toJSON exposes id and hides __v', async () => {
    const sale = await Sale.create(baseSale());
    const json = sale.toJSON();
    expect(json.id).toBeDefined();
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
  });
});

describe('Payment model', () => {
  const basePayment = async (overrides = {}) => {
    const sale = await Sale.create(baseSale());
    return Payment.create({
      sale: sale._id,
      receiptNo: 'SAH/R/2026/0001',
      amount: 20000,
      method: 'cash',
      paidAt: new Date(),
      ...overrides,
    });
  };

  test('generates a 32-character hex publicToken by default', async () => {
    const payment = await basePayment();
    expect(payment.publicToken).toMatch(/^[0-9a-f]{32}$/);
  });

  test('two payments never share a token', async () => {
    const a = await basePayment();
    const b = await basePayment({ receiptNo: 'SAH/R/2026/0002' });
    expect(a.publicToken).not.toBe(b.publicToken);
  });

  test('refuses a duplicate receiptNo', async () => {
    await basePayment();
    await expect(basePayment()).rejects.toThrow(/duplicate key/i);
  });

  test('refuses an amount below one naira', async () => {
    await expect(basePayment({ amount: 0 })).rejects.toThrow();
  });

  test('only known payment methods are accepted', async () => {
    await expect(basePayment({ method: 'crypto' })).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sahlearn-api && npx jest tests/unit/sale.model.test.js`
Expected: FAIL — `Cannot find module '../../src/models/Sale'`

- [ ] **Step 3: Write the implementations**

```js
// sahlearn-api/src/models/Sale.js
const mongoose = require('mongoose');
const { computeTotals, lineTotal, deriveStatus } = require('../utils/money');

const saleItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 200 },
    // Set when the admin picked an existing course rather than typing a line.
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, default: 0 },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    saleNo: { type: String, required: true, unique: true, trim: true },
    customer: {
      fullName: { type: String, required: true, trim: true, maxlength: 100 },
      phone: { type: String, required: true, trim: true },
      // Optional: set only when the buyer is a registered student, and the only
      // thing that puts this sale on their dashboard.
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    },
    items: {
      type: [saleItemSchema],
      validate: [
        { validator: (v) => v.length >= 1, message: 'A sale needs at least one item' },
        { validator: (v) => v.length <= 20, message: 'A sale cannot have more than 20 items' },
      ],
    },
    discount: {
      type: { type: String, enum: ['amount', 'percent'], default: 'amount' },
      value: { type: Number, default: 0, min: 0 },
      reason: { type: String, trim: true, maxlength: 200 },
    },
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    // Maintained by services/sales.service.js from the surviving Payment rows —
    // never incremented in place.
    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['unpaid', 'part_paid', 'paid', 'void'],
      default: 'unpaid',
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 500 },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    voidedAt: { type: Date, default: null },
    voidReason: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

// Totals are derived here and nowhere else, so a sale saved by any route ends
// up with figures that match its own items.
saleSchema.pre('validate', function () {
  this.items.forEach((item) => {
    item.lineTotal = lineTotal(item);
  });
  const { subtotal, discountAmount, total } = computeTotals(this.items, this.discount);
  this.subtotal = subtotal;
  this.discountAmount = discountAmount;
  this.total = total;
  this.balance = Math.max(total - (this.amountPaid || 0), 0);
  this.status = deriveStatus({
    total,
    amountPaid: this.amountPaid || 0,
    voided: !!this.voidedAt,
  });
});

saleSchema.index({ 'customer.student': 1, createdAt: -1 });
saleSchema.index({ 'customer.phone': 1 });
saleSchema.index({ status: 1, createdAt: -1 });

saleSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Sale', saleSchema);
```

```js
// sahlearn-api/src/models/Payment.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const paymentSchema = new mongoose.Schema(
  {
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
    receiptNo: { type: String, required: true, unique: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, enum: ['cash', 'transfer', 'pos', 'other'], default: 'cash' },
    reference: { type: String, trim: true, maxlength: 100 },
    paidAt: { type: Date, required: true, default: Date.now },
    // The share link. 16 random bytes, so it cannot be guessed or enumerated.
    publicToken: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    voidedAt: { type: Date, default: null },
    voidReason: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

paymentSchema.index({ sale: 1, paidAt: 1 });

paymentSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Payment', paymentSchema);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd sahlearn-api && npx jest tests/unit/sale.model.test.js`
Expected: PASS, 12 tests

- [ ] **Step 5: Commit**

```bash
git add sahlearn-api/src/models/Sale.js sahlearn-api/src/models/Payment.js sahlearn-api/tests/unit/sale.model.test.js
git commit -m "feat(sales): add Sale and Payment models"
```

---

### Task 4: The recompute service

The single place a sale's paid figure is worked out. Every later task calls this instead of doing its own arithmetic.

**Files:**
- Create: `sahlearn-api/src/services/sales.service.js`
- Test: `sahlearn-api/tests/integration/salesService.test.js`

**Interfaces:**
- Consumes: `Sale`, `Payment` models.
- Produces:
  - `recomputeSale(saleId) -> Promise<Sale>` — sums the non-voided payments, writes `amountPaid`, and saves, which triggers the model hook that derives `balance` and `status`.
  - `outstandingBalance(sale) -> number`

- [ ] **Step 1: Write the failing test**

```js
// sahlearn-api/tests/integration/salesService.test.js
const Sale = require('../../src/models/Sale');
const Payment = require('../../src/models/Payment');
const { recomputeSale, outstandingBalance } = require('../../src/services/sales.service');

let counter = 0;
const uniqueNo = (prefix) => `${prefix}/${(counter += 1)}`;

const makeSale = (overrides = {}) =>
  Sale.create({
    saleNo: uniqueNo('SAH/S/2026'),
    customer: { fullName: 'Musa Ibrahim', phone: '08012345678' },
    items: [{ description: 'Course', quantity: 1, unitPrice: 50000 }],
    ...overrides,
  });

const pay = (sale, amount, overrides = {}) =>
  Payment.create({
    sale: sale._id,
    receiptNo: uniqueNo('SAH/R/2026'),
    amount,
    method: 'cash',
    paidAt: new Date(),
    ...overrides,
  });

describe('recomputeSale', () => {
  test('sums the payments into amountPaid, balance and status', async () => {
    const sale = await makeSale();
    await pay(sale, 20000);
    const after = await recomputeSale(sale._id);

    expect(after.amountPaid).toBe(20000);
    expect(after.balance).toBe(30000);
    expect(after.status).toBe('part_paid');
  });

  test('three instalments close the sale exactly', async () => {
    const sale = await makeSale();
    for (const amount of [20000, 20000, 10000]) await pay(sale, amount);
    const after = await recomputeSale(sale._id);

    expect(after.amountPaid).toBe(50000);
    expect(after.balance).toBe(0);
    expect(after.status).toBe('paid');
  });

  test('voided payments are excluded', async () => {
    const sale = await makeSale();
    await pay(sale, 20000);
    await pay(sale, 15000, { voidedAt: new Date(), voidReason: 'wrong amount' });
    const after = await recomputeSale(sale._id);

    expect(after.amountPaid).toBe(20000);
    expect(after.balance).toBe(30000);
  });

  // Recomputing rather than decrementing is the whole point: run it twice and
  // the figure must not drift.
  test('recomputing repeatedly is idempotent', async () => {
    const sale = await makeSale();
    await pay(sale, 20000);
    await recomputeSale(sale._id);
    await recomputeSale(sale._id);
    const after = await recomputeSale(sale._id);
    expect(after.amountPaid).toBe(20000);
  });

  test('voiding the middle payment of three leaves the other two', async () => {
    const sale = await makeSale();
    await pay(sale, 10000);
    const middle = await pay(sale, 20000);
    await pay(sale, 5000);

    middle.voidedAt = new Date();
    await middle.save();
    const after = await recomputeSale(sale._id);

    expect(after.amountPaid).toBe(15000);
    expect(after.status).toBe('part_paid');
  });

  test('a voided sale stays void even when fully paid', async () => {
    const sale = await makeSale();
    await pay(sale, 50000);
    sale.voidedAt = new Date();
    await sale.save();
    const after = await recomputeSale(sale._id);
    expect(after.status).toBe('void');
  });

  test('returns null for an unknown sale rather than throwing', async () => {
    expect(await recomputeSale('650000000000000000000000')).toBeNull();
  });
});

describe('outstandingBalance', () => {
  test('is total minus paid, never negative', () => {
    expect(outstandingBalance({ total: 50000, amountPaid: 20000 })).toBe(30000);
    expect(outstandingBalance({ total: 50000, amountPaid: 80000 })).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sahlearn-api && npx jest tests/integration/salesService.test.js`
Expected: FAIL — `Cannot find module '../../src/services/sales.service'`

- [ ] **Step 3: Write the implementation**

```js
// sahlearn-api/src/services/sales.service.js
// A sale's paid figure is derived here and nowhere else.
//
// It is recomputed from the surviving payment rows every time, never
// incremented or decremented. Voiding a payment and re-voiding it, or two
// requests landing together, therefore cannot make the total drift away from
// the rows it is supposed to summarize.
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');

const outstandingBalance = (sale) => Math.max((sale?.total || 0) - (sale?.amountPaid || 0), 0);

const recomputeSale = async (saleId) => {
  if (!mongoose.isValidObjectId(saleId)) return null;
  const sale = await Sale.findById(saleId);
  if (!sale) return null;

  const [totals] = await Payment.aggregate([
    { $match: { sale: sale._id, voidedAt: null } },
    { $group: { _id: null, paid: { $sum: '$amount' } } },
  ]);

  sale.amountPaid = totals?.paid || 0;
  // balance and status are derived by the model's pre('validate') hook.
  await sale.save();
  return sale;
};

module.exports = { recomputeSale, outstandingBalance };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd sahlearn-api && npx jest tests/integration/salesService.test.js`
Expected: PASS, 8 tests

- [ ] **Step 5: Commit**

```bash
git add sahlearn-api/src/services/sales.service.js sahlearn-api/tests/integration/salesService.test.js
git commit -m "feat(sales): add sale recompute service"
```

---

### Task 5: Create, list and read sales

**Files:**
- Create: `sahlearn-api/src/controllers/admin.sales.controller.js`, `sahlearn-api/src/routes/admin.sales.routes.js`
- Modify: `sahlearn-api/src/app.js` — mount `/api/admin/sales` ABOVE the generic `/api/admin` at line 136, beside `/api/admin/daily-quizzes`
- Test: `sahlearn-api/tests/integration/adminSales.test.js`
- Test helper: `sahlearn-api/tests/factories.js` — add `saleBody()`

**Interfaces:**
- Consumes: `nextSaleNo` (Task 2), `Sale` (Task 3), `recomputeSale` (Task 4), `authMiddleware`, `validate`, `success`/`successList`.
- Produces:
  - `POST /api/admin/sales` → 201 `{ data: <sale> }`
  - `GET /api/admin/sales?page=&limit=&status=&q=` → 200 with `meta`
  - `GET /api/admin/sales/:id` → 200 `{ data: { ...sale, payments: [] } }`
  - Controller exports `listSales`, `createSale`, `getSale` (later tasks add more to this file).
  - `tests/factories.js` exports `saleBody(overrides)`.

- [ ] **Step 1: Write the failing test**

```js
// sahlearn-api/tests/integration/adminSales.test.js
const request = require('supertest');
const app = require('../../src/app');
const Sale = require('../../src/models/Sale');
const { createAdminToken, createStudent, saleBody } = require('../factories');

let token;
beforeEach(async () => {
  token = await createAdminToken();
});
const auth = (req) => req.set('Authorization', `Bearer ${token}`);
const post = (body) => auth(request(app).post('/api/admin/sales')).send(body);

describe('POST /api/admin/sales', () => {
  test('401 without a token', async () => {
    const res = await request(app).post('/api/admin/sales').send(saleBody());
    expect(res.status).toBe(401);
  });

  test('creates a sale with a generated number and computed totals', async () => {
    const res = await post(
      saleBody({ items: [{ description: 'HP EliteBook', quantity: 1, unitPrice: 185000 }] })
    );

    expect(res.status).toBe(201);
    expect(res.body.data.saleNo).toMatch(/^SAH\/S\/\d{4}\/\d{4}$/);
    expect(res.body.data.total).toBe(185000);
    expect(res.body.data.balance).toBe(185000);
    expect(res.body.data.status).toBe('unpaid');
  });

  test('applies a percentage discount', async () => {
    const res = await post(
      saleBody({
        items: [{ description: 'Course', quantity: 1, unitPrice: 50000 }],
        discount: { type: 'percent', value: 10, reason: 'scholarship' },
      })
    );
    expect(res.body.data.discountAmount).toBe(5000);
    expect(res.body.data.total).toBe(45000);
  });

  test('links a student when a studentId is given', async () => {
    const student = await createStudent();
    const res = await post(saleBody({ studentId: student.studentId }));
    expect(res.status).toBe(201);
    expect(String(res.body.data.customer.student)).toBe(String(student._id));
  });

  test('404 for a student id that does not exist', async () => {
    const res = await post(saleBody({ studentId: 'SAH/nope' }));
    expect(res.status).toBe(404);
    expect(await Sale.countDocuments()).toBe(0);
  });

  // Review Focus 4
  test('ignores totals sent by the client', async () => {
    const res = await post(
      saleBody({
        items: [{ description: 'Course', quantity: 1, unitPrice: 50000 }],
        subtotal: 1,
        total: 1,
        balance: 1,
        amountPaid: 49999,
        status: 'paid',
      })
    );
    expect(res.body.data.total).toBe(50000);
    expect(res.body.data.amountPaid).toBe(0);
    expect(res.body.data.status).toBe('unpaid');
  });

  // Review Focus 2
  test('422, not 500, for junk quantities and prices', async () => {
    for (const item of [
      { description: 'x', quantity: 1.5, unitPrice: 100 },
      { description: 'x', quantity: -1, unitPrice: 100 },
      { description: 'x', quantity: 1, unitPrice: -100 },
      { description: 'x', quantity: 1, unitPrice: 1.75 },
      { description: 'x', quantity: 'two', unitPrice: 100 },
      { description: '', quantity: 1, unitPrice: 100 },
    ]) {
      const res = await post(saleBody({ items: [item] }));
      expect(res.status).toBe(422);
    }
  });

  test('422 when there are no items at all', async () => {
    const res = await post(saleBody({ items: [] }));
    expect(res.status).toBe(422);
  });

  test('422 for a missing or malformed customer phone', async () => {
    expect((await post(saleBody({ phone: '' }))).status).toBe(422);
    expect((await post(saleBody({ phone: '12345' }))).status).toBe(422);
  });

  test('records which admin raised it', async () => {
    const res = await post(saleBody());
    expect(res.body.data.issuedBy).toBeDefined();
  });
});

describe('GET /api/admin/sales', () => {
  test('lists newest first with pagination meta', async () => {
    await post(saleBody({ fullName: 'First Buyer' }));
    await post(saleBody({ fullName: 'Second Buyer' }));

    const res = await auth(request(app).get('/api/admin/sales'));
    expect(res.status).toBe(200);
    expect(res.body.data[0].customer.fullName).toBe('Second Buyer');
    expect(res.body.meta).toMatchObject({ page: 1, total: 2, totalPages: 1 });
  });

  test('filters by status', async () => {
    await post(saleBody());
    const res = await auth(request(app).get('/api/admin/sales?status=paid'));
    expect(res.body.data).toHaveLength(0);
  });

  test('searches by customer name, phone and sale number', async () => {
    const created = await post(saleBody({ fullName: 'Aisha Bello', phone: '08099999999' }));

    for (const q of ['Aisha', '08099999999', created.body.data.saleNo]) {
      const res = await auth(request(app).get(`/api/admin/sales?q=${encodeURIComponent(q)}`));
      expect(res.body.data).toHaveLength(1);
    }
  });

  test('a search with regex characters does not crash', async () => {
    const res = await auth(request(app).get('/api/admin/sales?q=' + encodeURIComponent('a(b[c')));
    expect(res.status).toBe(200);
  });
});

describe('GET /api/admin/sales/:id', () => {
  test('returns the sale with an empty payments list', async () => {
    const created = await post(saleBody());
    const res = await auth(request(app).get(`/api/admin/sales/${created.body.data.id}`));

    expect(res.status).toBe(200);
    expect(res.body.data.payments).toEqual([]);
  });

  test('400 for a malformed id and 404 for an unknown one', async () => {
    expect((await auth(request(app).get('/api/admin/sales/not-an-id'))).status).toBe(400);
    expect(
      (await auth(request(app).get('/api/admin/sales/650000000000000000000000'))).status
    ).toBe(404);
  });
});
```

- [ ] **Step 2: Add the factory helper**

```js
// sahlearn-api/tests/factories.js — add near the other builders and export it
const saleBody = (overrides = {}) => {
  const { fullName, phone, items, ...rest } = overrides;
  return {
    fullName: fullName || 'Musa Ibrahim',
    phone: phone === undefined ? '08012345678' : phone,
    items: items || [{ description: 'Full Stack Course', quantity: 1, unitPrice: 50000 }],
    ...rest,
  };
};
```

Add `saleBody` to the `module.exports` object.

- [ ] **Step 3: Run test to verify it fails**

Run: `cd sahlearn-api && npx jest tests/integration/adminSales.test.js`
Expected: FAIL — every request 404s, because the router is not mounted yet.

- [ ] **Step 4: Write the controller**

```js
// sahlearn-api/src/controllers/admin.sales.controller.js
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { nextSaleNo } = require('../utils/docNumber');
const { success, successList } = require('../utils/apiResponse');

const badId = (res) => res.status(400).json({ status: 'error', message: 'Invalid sale id' });
const missing = (res) => res.status(404).json({ status: 'error', message: 'Sale not found' });

// A search box is user input going into a regex. Escaping it stops '(' or '['
// throwing, and stops a pathological pattern pinning the database.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listSales = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);

  const filter = {};
  if (['unpaid', 'part_paid', 'paid', 'void'].includes(req.query.status)) {
    filter.status = req.query.status;
  }
  const q = (req.query.q || '').trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ 'customer.fullName': rx }, { 'customer.phone': rx }, { saleNo: rx }];
  }

  const [total, sales] = await Promise.all([
    Sale.countDocuments(filter),
    Sale.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  successList(
    res,
    sales.map((s) => ({ ...s, id: s._id })),
    { page, limit, total, totalPages: Math.ceil(total / limit) }
  );
};

const createSale = async (req, res) => {
  // A student ID is optional, but a wrong one is refused rather than quietly
  // dropped — otherwise the sale silently never reaches the student's dashboard.
  let student = null;
  const studentId = (req.body.studentId || '').trim();
  if (studentId) {
    student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'We could not find that student ID. Leave it blank for a non-student customer.',
      });
    }
  }

  // Only these fields are read from the body. Any subtotal, total, balance,
  // amountPaid or status the client sent is ignored.
  const sale = await Sale.create({
    saleNo: await nextSaleNo(),
    customer: {
      fullName: req.body.fullName,
      phone: req.body.phone,
      student: student ? student._id : null,
    },
    items: (req.body.items || []).map((i) => ({
      description: i.description,
      course: i.course || undefined,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    discount: req.body.discount || { type: 'amount', value: 0 },
    notes: req.body.notes,
    issuedBy: req.user._id,
  });

  success(res, sale, 201);
};

const getSale = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const sale = await Sale.findById(req.params.id).lean();
  if (!sale) return missing(res);

  const payments = await Payment.find({ sale: sale._id }).sort({ paidAt: 1 }).lean();

  success(res, {
    ...sale,
    id: sale._id,
    payments: payments.map((p) => ({ ...p, id: p._id })),
  });
};

module.exports = { listSales, createSale, getSale, badId, missing, escapeRegex };
```

- [ ] **Step 5: Write the routes**

```js
// sahlearn-api/src/routes/admin.sales.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const { listSales, createSale, getSale } = require('../controllers/admin.sales.controller');

router.use(authMiddleware);

// Shared by create and update. Money is whole naira, so isInt rather than
// isFloat everywhere — 1.75 naira is not a thing.
const itemValidators = [
  body('items').isArray({ min: 1, max: 20 }).withMessage('Add at least one item'),
  body('items.*.description')
    .isString()
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Every item needs a description')
    .isLength({ max: 200 }),
  body('items.*.quantity').isInt({ min: 1, max: 10000 }).withMessage('Quantity must be a whole number of 1 or more'),
  body('items.*.unitPrice').isInt({ min: 0, max: 1000000000 }).withMessage('Price must be a whole number of naira'),
  body('discount.type').optional().isIn(['amount', 'percent']),
  body('discount.value').optional().isInt({ min: 0 }).withMessage('Discount must be a whole number'),
  body('discount.reason').optional().isString().bail().trim().isLength({ max: 200 }),
  body('notes').optional().isString().bail().trim().isLength({ max: 500 }),
];

router.get('/', listSales);
router.post(
  '/',
  [
    // .isString().bail() before .trim(): express-validator does not write a
    // sanitized value back for non-string input, so trimming an array would
    // otherwise reach the controller and throw a 500.
    body('fullName').isString().bail().trim().isLength({ min: 2, max: 100 }).withMessage('Customer name is required'),
    body('phone')
      .isString()
      .bail()
      .trim()
      .matches(/^(\+234|234|0)[789][01]\d{8}$/)
      .withMessage('Enter a valid Nigerian phone number, e.g. 08012345678'),
    body('studentId').optional({ values: 'falsy' }).isString().bail().trim().isLength({ max: 50 }),
    ...itemValidators,
  ],
  validate,
  createSale
);
router.get('/:id', getSale);

module.exports = router;
```

- [ ] **Step 6: Mount the router**

In `sahlearn-api/src/app.js`, require the router beside the other admin routers and mount it immediately above the generic `/api/admin` line:

```js
app.use('/api/admin/daily-quizzes', adminDailyQuizzesRoutes);
app.use('/api/admin/sales', adminSalesRoutes);   // ← add, ABOVE the line below
app.use('/api/admin', adminRoutes);
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd sahlearn-api && npx jest tests/integration/adminSales.test.js`
Expected: PASS, 16 tests

- [ ] **Step 8: Commit**

```bash
git add sahlearn-api/src/controllers/admin.sales.controller.js sahlearn-api/src/routes/admin.sales.routes.js sahlearn-api/src/app.js sahlearn-api/tests/integration/adminSales.test.js sahlearn-api/tests/factories.js
git commit -m "feat(sales): add admin create, list and read sale endpoints"
```

---

### Task 6: Update and void a sale

**Files:**
- Modify: `sahlearn-api/src/controllers/admin.sales.controller.js`, `sahlearn-api/src/routes/admin.sales.routes.js`
- Test: `sahlearn-api/tests/integration/adminSales.update.test.js`

**Interfaces:**
- Consumes: everything from Task 5, plus `recomputeSale` from Task 4.
- Produces:
  - `PATCH /api/admin/sales/:id` — `items`/`discount` only while no payment exists (409 otherwise); `fullName`, `phone`, `notes` always.
  - `POST /api/admin/sales/:id/void` — body `{ reason }`, voids the sale and its payments.
  - Controller gains `updateSale`, `voidSale`.

- [ ] **Step 1: Write the failing test**

```js
// sahlearn-api/tests/integration/adminSales.update.test.js
const request = require('supertest');
const app = require('../../src/app');
const Payment = require('../../src/models/Payment');
const { createAdminToken, saleBody } = require('../factories');

let token;
beforeEach(async () => {
  token = await createAdminToken();
});
const auth = (req) => req.set('Authorization', `Bearer ${token}`);

const newSale = async (overrides) => {
  const res = await auth(request(app).post('/api/admin/sales')).send(saleBody(overrides));
  return res.body.data;
};
const payFor = (sale, amount = 10000) =>
  auth(request(app).post(`/api/admin/sales/${sale.id}/payments`)).send({ amount, method: 'cash' });

describe('PATCH /api/admin/sales/:id', () => {
  test('updates items and recomputes the total while unpaid', async () => {
    const sale = await newSale();
    const res = await auth(request(app).patch(`/api/admin/sales/${sale.id}`)).send({
      items: [{ description: 'Course', quantity: 2, unitPrice: 50000 }],
    });

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(100000);
    expect(res.body.data.balance).toBe(100000);
  });

  test('updates the customer and notes', async () => {
    const sale = await newSale();
    const res = await auth(request(app).patch(`/api/admin/sales/${sale.id}`)).send({
      fullName: 'Corrected Name',
      notes: 'collect on Friday',
    });
    expect(res.body.data.customer.fullName).toBe('Corrected Name');
    expect(res.body.data.notes).toBe('collect on Friday');
  });

  test('409 when changing items after a payment exists', async () => {
    const sale = await newSale();
    await payFor(sale);

    const res = await auth(request(app).patch(`/api/admin/sales/${sale.id}`)).send({
      items: [{ description: 'Course', quantity: 2, unitPrice: 50000 }],
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already been paid|cannot be changed/i);
  });

  test('409 when changing the discount after a payment exists', async () => {
    const sale = await newSale();
    await payFor(sale);
    const res = await auth(request(app).patch(`/api/admin/sales/${sale.id}`)).send({
      discount: { type: 'percent', value: 50 },
    });
    expect(res.status).toBe(409);
  });

  test('name and notes stay editable after a payment', async () => {
    const sale = await newSale();
    await payFor(sale);
    const res = await auth(request(app).patch(`/api/admin/sales/${sale.id}`)).send({
      notes: 'paid in branch',
    });
    expect(res.status).toBe(200);
  });

  test('409 when editing a voided sale', async () => {
    const sale = await newSale();
    await auth(request(app).post(`/api/admin/sales/${sale.id}/void`)).send({ reason: 'duplicate' });
    const res = await auth(request(app).patch(`/api/admin/sales/${sale.id}`)).send({ notes: 'x' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/admin/sales/:id/void', () => {
  test('voids the sale and its payments, and records the reason', async () => {
    const sale = await newSale();
    await payFor(sale);

    const res = await auth(request(app).post(`/api/admin/sales/${sale.id}/void`)).send({
      reason: 'wrong customer',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('void');
    expect(res.body.data.voidReason).toBe('wrong customer');

    const payments = await Payment.find({ sale: sale.id });
    expect(payments.every((p) => p.voidedAt !== null)).toBe(true);
  });

  test('422 without a reason', async () => {
    const sale = await newSale();
    const res = await auth(request(app).post(`/api/admin/sales/${sale.id}/void`)).send({});
    expect(res.status).toBe(422);
  });

  test('409 when voiding twice', async () => {
    const sale = await newSale();
    await auth(request(app).post(`/api/admin/sales/${sale.id}/void`)).send({ reason: 'first' });
    const res = await auth(request(app).post(`/api/admin/sales/${sale.id}/void`)).send({ reason: 'again' });
    expect(res.status).toBe(409);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sahlearn-api && npx jest tests/integration/adminSales.update.test.js`
Expected: FAIL — PATCH and void routes 404.

- [ ] **Step 3: Add the controller functions**

```js
// sahlearn-api/src/controllers/admin.sales.controller.js — add these

const voided = (res) =>
  res.status(409).json({ status: 'error', message: 'This sale has been voided.' });

const updateSale = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const sale = await Sale.findById(req.params.id);
  if (!sale) return missing(res);
  if (sale.voidedAt) return voided(res);

  const changesMoney = req.body.items !== undefined || req.body.discount !== undefined;
  if (changesMoney) {
    // Rewriting what was sold after money changed hands would invalidate a
    // receipt the customer already holds, so it is refused rather than silently
    // accepted.
    const paid = await Payment.exists({ sale: sale._id, voidedAt: null });
    if (paid) {
      return res.status(409).json({
        status: 'error',
        message: 'This sale has already been paid against, so its items and discount cannot be changed.',
      });
    }
    if (req.body.items !== undefined) {
      sale.items = req.body.items.map((i) => ({
        description: i.description,
        course: i.course || undefined,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }));
    }
    if (req.body.discount !== undefined) sale.discount = req.body.discount;
  }

  if (req.body.fullName !== undefined) sale.customer.fullName = req.body.fullName;
  if (req.body.phone !== undefined) sale.customer.phone = req.body.phone;
  if (req.body.notes !== undefined) sale.notes = req.body.notes;

  await sale.save();
  success(res, sale);
};

const voidSale = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const sale = await Sale.findById(req.params.id);
  if (!sale) return missing(res);
  if (sale.voidedAt) return voided(res);

  const now = new Date();
  // Voiding the sale voids its receipts too: a receipt for a cancelled sale
  // would otherwise still read as valid in the customer's hand.
  await Payment.updateMany(
    { sale: sale._id, voidedAt: null },
    { $set: { voidedAt: now, voidReason: req.body.reason } }
  );

  sale.voidedAt = now;
  sale.voidReason = req.body.reason;
  sale.amountPaid = 0;
  await sale.save();

  success(res, sale);
};
```

Add `updateSale` and `voidSale` to `module.exports`.

- [ ] **Step 4: Add the routes**

```js
// sahlearn-api/src/routes/admin.sales.routes.js — add below router.get('/:id', getSale)
router.patch(
  '/:id',
  [
    body('fullName').optional().isString().bail().trim().isLength({ min: 2, max: 100 }),
    body('phone').optional().isString().bail().trim().matches(/^(\+234|234|0)[789][01]\d{8}$/),
    body('items').optional().isArray({ min: 1, max: 20 }),
    body('items.*.description').optional().isString().bail().trim().notEmpty().isLength({ max: 200 }),
    body('items.*.quantity').optional().isInt({ min: 1, max: 10000 }),
    body('items.*.unitPrice').optional().isInt({ min: 0, max: 1000000000 }),
    body('discount.type').optional().isIn(['amount', 'percent']),
    body('discount.value').optional().isInt({ min: 0 }),
    body('notes').optional().isString().bail().trim().isLength({ max: 500 }),
  ],
  validate,
  updateSale
);
router.post(
  '/:id/void',
  [body('reason').isString().bail().trim().notEmpty().withMessage('A reason is required').isLength({ max: 200 })],
  validate,
  voidSale
);
```

Import `updateSale` and `voidSale` at the top of the file.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd sahlearn-api && npx jest tests/integration/adminSales.update.test.js`
Expected: PASS, 9 tests

- [ ] **Step 6: Commit**

```bash
git add sahlearn-api/src/controllers/admin.sales.controller.js sahlearn-api/src/routes/admin.sales.routes.js sahlearn-api/tests/integration/adminSales.update.test.js
git commit -m "feat(sales): add sale update and void, locked once paid"
```

---

### Task 7: Record a payment and issue its receipt

**Files:**
- Modify: `sahlearn-api/src/controllers/admin.sales.controller.js`, `sahlearn-api/src/routes/admin.sales.routes.js`
- Test: `sahlearn-api/tests/integration/adminPayments.test.js`

**Interfaces:**
- Consumes: `nextReceiptNo` (Task 2), `Payment` (Task 3), `recomputeSale`/`outstandingBalance` (Task 4).
- Produces:
  - `POST /api/admin/sales/:id/payments` → 201 `{ data: { payment, sale } }` where `payment` includes `receiptNo` and `publicToken`.
  - Controller gains `recordPayment`.

- [ ] **Step 1: Write the failing test**

```js
// sahlearn-api/tests/integration/adminPayments.test.js
const request = require('supertest');
const app = require('../../src/app');
const Payment = require('../../src/models/Payment');
const { createAdminToken, saleBody } = require('../factories');

let token;
beforeEach(async () => {
  token = await createAdminToken();
});
const auth = (req) => req.set('Authorization', `Bearer ${token}`);

// The default factory sale totals 50000.
const newSale = async (overrides) => {
  const res = await auth(request(app).post('/api/admin/sales')).send(saleBody(overrides));
  return res.body.data;
};
const pay = (sale, body) => auth(request(app).post(`/api/admin/sales/${sale.id}/payments`)).send(body);

describe('POST /api/admin/sales/:id/payments', () => {
  test('401 without a token', async () => {
    const sale = await newSale();
    const res = await request(app).post(`/api/admin/sales/${sale.id}/payments`).send({ amount: 100 });
    expect(res.status).toBe(401);
  });

  test('records a payment, issues a numbered receipt and updates the sale', async () => {
    const sale = await newSale();
    const res = await pay(sale, { amount: 20000, method: 'transfer', reference: 'TRF-99' });

    expect(res.status).toBe(201);
    expect(res.body.data.payment.receiptNo).toMatch(/^SAH\/R\/\d{4}\/\d{4}$/);
    expect(res.body.data.payment.publicToken).toMatch(/^[0-9a-f]{32}$/);
    expect(res.body.data.sale.amountPaid).toBe(20000);
    expect(res.body.data.sale.balance).toBe(30000);
    expect(res.body.data.sale.status).toBe('part_paid');
  });

  test('a payment of exactly the balance closes the sale', async () => {
    const sale = await newSale();
    await pay(sale, { amount: 20000, method: 'cash' });
    const res = await pay(sale, { amount: 30000, method: 'cash' });

    expect(res.body.data.sale.balance).toBe(0);
    expect(res.body.data.sale.status).toBe('paid');
  });

  test('422 for one naira more than the balance, and nothing is written', async () => {
    const sale = await newSale();
    const res = await pay(sale, { amount: 50001, method: 'cash' });

    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/balance/i);
    expect(await Payment.countDocuments()).toBe(0);
  });

  test('422 for a second payment that would overshoot', async () => {
    const sale = await newSale();
    await pay(sale, { amount: 30000, method: 'cash' });
    const res = await pay(sale, { amount: 30000, method: 'cash' });
    expect(res.status).toBe(422);
  });

  // Review Focus 2
  test('422, not 500, for junk amounts', async () => {
    const sale = await newSale();
    for (const amount of [0, -100, 1.5, 'lots', null, [], {}]) {
      const res = await pay(sale, { amount, method: 'cash' });
      expect(res.status).toBe(422);
    }
  });

  test('422 for an unknown payment method', async () => {
    const sale = await newSale();
    const res = await pay(sale, { amount: 100, method: 'crypto' });
    expect(res.status).toBe(422);
  });

  test('409 when paying against a voided sale', async () => {
    const sale = await newSale();
    await auth(request(app).post(`/api/admin/sales/${sale.id}/void`)).send({ reason: 'cancelled' });
    const res = await pay(sale, { amount: 100, method: 'cash' });
    expect(res.status).toBe(409);
  });

  test('404 for an unknown sale and 400 for a malformed id', async () => {
    expect(
      (await auth(request(app).post('/api/admin/sales/650000000000000000000000/payments')).send({
        amount: 100,
        method: 'cash',
      })).status
    ).toBe(404);
    expect(
      (await auth(request(app).post('/api/admin/sales/not-an-id/payments')).send({
        amount: 100,
        method: 'cash',
      })).status
    ).toBe(400);
  });

  test('accepts a back-dated payment', async () => {
    const sale = await newSale();
    const paidAt = new Date('2026-09-01T10:00:00.000Z').toISOString();
    const res = await pay(sale, { amount: 100, method: 'cash', paidAt });
    expect(new Date(res.body.data.payment.paidAt).toISOString()).toBe(paidAt);
  });

  // Review Focus 3
  test('simultaneous payments get distinct receipt numbers', async () => {
    const sale = await newSale({ items: [{ description: 'Course', quantity: 1, unitPrice: 50000 }] });
    await Promise.all([
      pay(sale, { amount: 1000, method: 'cash' }),
      pay(sale, { amount: 1000, method: 'cash' }),
      pay(sale, { amount: 1000, method: 'cash' }),
    ]);

    const payments = await Payment.find({ sale: sale.id }).lean();
    const numbers = payments.map((p) => p.receiptNo);
    expect(new Set(numbers).size).toBe(numbers.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sahlearn-api && npx jest tests/integration/adminPayments.test.js`
Expected: FAIL — the payments route 404s.

- [ ] **Step 3: Add the controller function**

```js
// sahlearn-api/src/controllers/admin.sales.controller.js — add
const { nextSaleNo, nextReceiptNo } = require('../utils/docNumber');   // extend the existing import
const { recomputeSale, outstandingBalance } = require('../services/sales.service');

const recordPayment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const sale = await Sale.findById(req.params.id);
  if (!sale) return missing(res);
  if (sale.voidedAt) {
    return res.status(409).json({
      status: 'error',
      message: 'This sale has been voided, so no further payment can be recorded against it.',
    });
  }

  const amount = req.body.amount;
  const balance = outstandingBalance(sale);
  // Overpayment is a refund problem, and refunds are out of scope. Refused with
  // the figure named, so the admin can see what to collect.
  if (amount > balance) {
    return res.status(422).json({
      status: 'error',
      message: `That is more than the outstanding balance of ₦${balance.toLocaleString('en-NG')}.`,
      errors: [{ field: 'amount', message: `The balance is ₦${balance.toLocaleString('en-NG')}` }],
    });
  }

  const payment = await Payment.create({
    sale: sale._id,
    receiptNo: await nextReceiptNo(),
    amount,
    method: req.body.method,
    reference: req.body.reference,
    paidAt: req.body.paidAt ? new Date(req.body.paidAt) : new Date(),
    recordedBy: req.user._id,
  });

  const updated = await recomputeSale(sale._id);
  success(res, { payment, sale: updated }, 201);
};
```

Add `recordPayment` to `module.exports`.

- [ ] **Step 4: Add the route**

```js
// sahlearn-api/src/routes/admin.sales.routes.js — add
router.post(
  '/:id/payments',
  [
    body('amount').isInt({ min: 1, max: 1000000000 }).withMessage('Enter a whole number of naira'),
    body('method').isIn(['cash', 'transfer', 'pos', 'other']).withMessage('Choose a payment method'),
    body('reference').optional().isString().bail().trim().isLength({ max: 100 }),
    body('paidAt').optional().isISO8601().withMessage('Invalid date'),
  ],
  validate,
  recordPayment
);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd sahlearn-api && npx jest tests/integration/adminPayments.test.js`
Expected: PASS, 11 tests

- [ ] **Step 6: Commit**

```bash
git add sahlearn-api/src/controllers/admin.sales.controller.js sahlearn-api/src/routes/admin.sales.routes.js sahlearn-api/tests/integration/adminPayments.test.js
git commit -m "feat(sales): record payments and issue numbered receipts"
```

---

### Task 8: Void a payment

**Files:**
- Modify: `sahlearn-api/src/controllers/admin.sales.controller.js`, `sahlearn-api/src/routes/admin.sales.routes.js`
- Test: `sahlearn-api/tests/integration/adminPayments.void.test.js`

**Interfaces:**
- Produces: `POST /api/admin/payments/:id/void` mounted under the same router as `/api/admin/sales` — see the mounting note in Step 4. Controller gains `voidPayment`.

- [ ] **Step 1: Write the failing test**

```js
// sahlearn-api/tests/integration/adminPayments.void.test.js
const request = require('supertest');
const app = require('../../src/app');
const Sale = require('../../src/models/Sale');
const { createAdminToken, saleBody } = require('../factories');

let token;
beforeEach(async () => {
  token = await createAdminToken();
});
const auth = (req) => req.set('Authorization', `Bearer ${token}`);

const newSale = async () => (await auth(request(app).post('/api/admin/sales')).send(saleBody())).body.data;
const pay = async (sale, amount) =>
  (await auth(request(app).post(`/api/admin/sales/${sale.id}/payments`)).send({ amount, method: 'cash' }))
    .body.data.payment;
const voidPayment = (payment, reason = 'entered twice') =>
  auth(request(app).post(`/api/admin/payments/${payment.id}/void`)).send({ reason });

describe('POST /api/admin/payments/:id/void', () => {
  test('voids the receipt and restores the balance', async () => {
    const sale = await newSale();
    const payment = await pay(sale, 20000);

    const res = await voidPayment(payment);
    expect(res.status).toBe(200);
    expect(res.body.data.payment.voidedAt).not.toBeNull();
    expect(res.body.data.sale.amountPaid).toBe(0);
    expect(res.body.data.sale.balance).toBe(50000);
    expect(res.body.data.sale.status).toBe('unpaid');
  });

  test('voiding the middle payment of three leaves the others intact', async () => {
    const sale = await newSale();
    await pay(sale, 10000);
    const middle = await pay(sale, 20000);
    await pay(sale, 5000);

    const res = await voidPayment(middle);
    expect(res.body.data.sale.amountPaid).toBe(15000);
    expect(res.body.data.sale.status).toBe('part_paid');
  });

  test('the receipt number is kept, not reused', async () => {
    const sale = await newSale();
    const payment = await pay(sale, 10000);
    await voidPayment(payment);
    const next = await pay(sale, 10000);
    expect(next.receiptNo).not.toBe(payment.receiptNo);
  });

  test('409 when voiding the same payment twice, and the balance does not drift', async () => {
    const sale = await newSale();
    const payment = await pay(sale, 20000);
    await voidPayment(payment);

    const res = await voidPayment(payment);
    expect(res.status).toBe(409);

    const after = await Sale.findById(sale.id);
    expect(after.amountPaid).toBe(0);
    expect(after.balance).toBe(50000);
  });

  test('422 without a reason', async () => {
    const sale = await newSale();
    const payment = await pay(sale, 10000);
    const res = await auth(request(app).post(`/api/admin/payments/${payment.id}/void`)).send({});
    expect(res.status).toBe(422);
  });

  test('404 for an unknown payment and 400 for a malformed id', async () => {
    expect((await auth(request(app).post('/api/admin/payments/650000000000000000000000/void')).send({ reason: 'x' })).status).toBe(404);
    expect((await auth(request(app).post('/api/admin/payments/not-an-id/void')).send({ reason: 'x' })).status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sahlearn-api && npx jest tests/integration/adminPayments.void.test.js`
Expected: FAIL — route 404s.

- [ ] **Step 3: Add the controller function**

```js
// sahlearn-api/src/controllers/admin.sales.controller.js — add
const voidPayment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ status: 'error', message: 'Invalid payment id' });
  }
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ status: 'error', message: 'Payment not found' });
  if (payment.voidedAt) {
    return res.status(409).json({ status: 'error', message: 'This receipt has already been voided.' });
  }

  payment.voidedAt = new Date();
  payment.voidReason = req.body.reason;
  await payment.save();

  // Recomputed from the surviving rows, not decremented, so a double void
  // cannot push the balance the wrong way.
  const sale = await recomputeSale(payment.sale);
  success(res, { payment, sale });
};
```

Add `voidPayment` to `module.exports`.

- [ ] **Step 4: Add the route and mount it**

The path is `/api/admin/payments/...`, not under `/api/admin/sales`, so it needs its own mount. Add to `admin.sales.routes.js`:

```js
// exported separately because it lives at /api/admin/payments
const paymentsRouter = express.Router();
paymentsRouter.use(authMiddleware);
paymentsRouter.post(
  '/:id/void',
  [body('reason').isString().bail().trim().notEmpty().withMessage('A reason is required').isLength({ max: 200 })],
  validate,
  voidPayment
);

module.exports = router;
module.exports.paymentsRouter = paymentsRouter;
```

In `app.js`, beside the sales mount and still above the generic `/api/admin`:

```js
app.use('/api/admin/sales', adminSalesRoutes);
app.use('/api/admin/payments', adminSalesRoutes.paymentsRouter);
app.use('/api/admin', adminRoutes);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd sahlearn-api && npx jest tests/integration/adminPayments.void.test.js`
Expected: PASS, 6 tests

- [ ] **Step 6: Commit**

```bash
git add sahlearn-api/src/controllers/admin.sales.controller.js sahlearn-api/src/routes/admin.sales.routes.js sahlearn-api/src/app.js sahlearn-api/tests/integration/adminPayments.void.test.js
git commit -m "feat(sales): void a receipt and restore the balance"
```

---

### Task 9: The public receipt endpoint

**Files:**
- Create: `sahlearn-api/src/controllers/receipts.controller.js`, `sahlearn-api/src/routes/receipts.routes.js`
- Modify: `sahlearn-api/src/middleware/rateLimit.js`, `sahlearn-api/src/app.js`
- Test: `sahlearn-api/tests/integration/publicReceipt.test.js`

**Interfaces:**
- Produces:
  - `GET /api/receipts/:token` → 200 with the payload below, or 404.
  - Controller exports `getPublicReceipt`, `findPaymentByToken(token) -> Promise<{ payment, sale } | null>` (Task 10 reuses it).
  - `rateLimit.js` exports `receiptReadLimiter` (60 / 15 min) and `receiptPdfLimiter` (20 / 15 min).

Payload — built field by field, never by serializing a document:

```js
{
  receiptNo, paidAt, method, reference, void: false, voidReason: null,
  customerName,                       // NO phone, NO student id, NO mongo ids
  saleNo,
  items: [{ description, quantity, unitPrice, lineTotal }],
  subtotal, discountAmount, discountReason, total,
  amountThisPayment, totalPaid, balance,
}
```

- [ ] **Step 1: Write the failing test**

```js
// sahlearn-api/tests/integration/publicReceipt.test.js
const request = require('supertest');
const app = require('../../src/app');
const { createAdminToken, createStudent, saleBody } = require('../factories');

let token;
beforeEach(async () => {
  token = await createAdminToken();
});
const auth = (req) => req.set('Authorization', `Bearer ${token}`);

const sellAndPay = async (overrides = {}, amount = 20000) => {
  const sale = (await auth(request(app).post('/api/admin/sales')).send(saleBody(overrides))).body.data;
  const payment = (
    await auth(request(app).post(`/api/admin/sales/${sale.id}/payments`)).send({ amount, method: 'cash' })
  ).body.data.payment;
  return { sale, payment };
};

describe('GET /api/receipts/:token', () => {
  test('returns the receipt for a valid token', async () => {
    const { payment } = await sellAndPay();
    const res = await request(app).get(`/api/receipts/${payment.publicToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      receiptNo: payment.receiptNo,
      customerName: 'Musa Ibrahim',
      amountThisPayment: 20000,
      totalPaid: 20000,
      balance: 30000,
      total: 50000,
      void: false,
    });
    expect(res.body.data.items[0]).toMatchObject({ description: 'Full Stack Course', quantity: 1 });
  });

  test('never exposes the phone number, student id or mongo ids', async () => {
    const student = await createStudent();
    const { payment } = await sellAndPay({ phone: '08012345678', studentId: student.studentId });

    const res = await request(app).get(`/api/receipts/${payment.publicToken}`);
    const body = JSON.stringify(res.body);

    expect(body).not.toContain('08012345678');
    expect(body).not.toContain(student.studentId);
    expect(body).not.toContain(String(student._id));
    expect(body).not.toContain('_id');
    expect(res.body.data.customerPhone).toBeUndefined();
  });

  test('a second payment shows the running total, not just its own amount', async () => {
    const { sale } = await sellAndPay({}, 20000);
    const second = (
      await auth(request(app).post(`/api/admin/sales/${sale.id}/payments`)).send({ amount: 30000, method: 'cash' })
    ).body.data.payment;

    const res = await request(app).get(`/api/receipts/${second.publicToken}`);
    expect(res.body.data).toMatchObject({ amountThisPayment: 30000, totalPaid: 50000, balance: 0 });
  });

  // A customer already holds this link, so it must explain itself rather than 404.
  test('a voided receipt returns 200 with void true and the reason', async () => {
    const { payment } = await sellAndPay();
    await auth(request(app).post(`/api/admin/payments/${payment.id}/void`)).send({ reason: 'entered twice' });

    const res = await request(app).get(`/api/receipts/${payment.publicToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.void).toBe(true);
    expect(res.body.data.voidReason).toBe('entered twice');
  });

  // Review Focus 5
  test('404 for unknown and malformed tokens alike, with the same message', async () => {
    const unknown = await request(app).get('/api/receipts/' + 'a'.repeat(32));
    const malformed = await request(app).get('/api/receipts/not-a-token');
    const longer = await request(app).get('/api/receipts/' + 'z'.repeat(500));

    for (const res of [unknown, malformed, longer]) {
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('error');
    }
    expect(malformed.body.message).toBe(unknown.body.message);
  });

  test('needs no authentication at all', async () => {
    const { payment } = await sellAndPay();
    const res = await request(app).get(`/api/receipts/${payment.publicToken}`);
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sahlearn-api && npx jest tests/integration/publicReceipt.test.js`
Expected: FAIL — `/api/receipts/...` 404s for every case, including the ones expecting 200.

- [ ] **Step 3: Write the controller**

```js
// sahlearn-api/src/controllers/receipts.controller.js
// PUBLIC. No auth. Anyone with the link can read this, so the payload is built
// field by field and never by serializing a document — that is what keeps the
// customer's phone number and the student id off a page that gets forwarded.
const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const { success } = require('../utils/apiResponse');

const TOKEN = /^[0-9a-f]{32}$/;

const findPaymentByToken = async (token) => {
  if (typeof token !== 'string' || !TOKEN.test(token)) return null;
  const payment = await Payment.findOne({ publicToken: token }).lean();
  if (!payment) return null;
  const sale = await Sale.findById(payment.sale).lean();
  if (!sale) return null;
  return { payment, sale };
};

// The sum paid up to and including this receipt, so a customer reading an old
// receipt sees what was true when it was issued rather than today's figure.
const paidUpTo = async (sale, payment) => {
  const [totals] = await Payment.aggregate([
    { $match: { sale: sale._id, voidedAt: null, paidAt: { $lte: payment.paidAt } } },
    { $group: { _id: null, paid: { $sum: '$amount' } } },
  ]);
  return totals?.paid || 0;
};

const buildReceipt = async (sale, payment) => {
  const totalPaid = payment.voidedAt ? sale.amountPaid : await paidUpTo(sale, payment);
  return {
    receiptNo: payment.receiptNo,
    paidAt: payment.paidAt,
    method: payment.method,
    reference: payment.reference || '',
    void: !!payment.voidedAt,
    voidReason: payment.voidReason || null,
    customerName: sale.customer.fullName,
    saleNo: sale.saleNo,
    items: sale.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    subtotal: sale.subtotal,
    discountAmount: sale.discountAmount,
    discountReason: sale.discount?.reason || '',
    total: sale.total,
    amountThisPayment: payment.amount,
    totalPaid,
    balance: Math.max(sale.total - totalPaid, 0),
  };
};

const getPublicReceipt = async (req, res) => {
  const found = await findPaymentByToken(req.params.token);
  // Same message for a malformed token and an unknown one, so this cannot be
  // used to learn anything about which receipts exist.
  if (!found) return res.status(404).json({ status: 'error', message: 'Receipt not found' });

  success(res, await buildReceipt(found.sale, found.payment));
};

module.exports = { getPublicReceipt, findPaymentByToken, buildReceipt };
```

- [ ] **Step 4: Add the limiters and routes**

```js
// sahlearn-api/src/middleware/rateLimit.js — add and export
const receiptReadLimiter = makeRateLimiter(60, 15, 'Too many requests. Please slow down.');
const receiptPdfLimiter = makeRateLimiter(20, 15, 'Too many downloads. Try again shortly.');
```

```js
// sahlearn-api/src/routes/receipts.routes.js — PUBLIC. No auth middleware here.
const express = require('express');
const router = express.Router();
const { receiptReadLimiter } = require('../middleware/rateLimit');
const { getPublicReceipt } = require('../controllers/receipts.controller');

router.get('/:token', receiptReadLimiter, getPublicReceipt);

module.exports = router;
```

In `app.js`, beside the other public routers (near `/api/daily-quiz` at line 113):

```js
app.use('/api/receipts', receiptsRoutes);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd sahlearn-api && npx jest tests/integration/publicReceipt.test.js`
Expected: PASS, 6 tests

- [ ] **Step 6: Commit**

```bash
git add sahlearn-api/src/controllers/receipts.controller.js sahlearn-api/src/routes/receipts.routes.js sahlearn-api/src/middleware/rateLimit.js sahlearn-api/src/app.js sahlearn-api/tests/integration/publicReceipt.test.js
git commit -m "feat(receipts): add public receipt endpoint behind an unguessable token"
```

---

### Task 10: The receipt PDF

**Files:**
- Modify: `sahlearn-api/src/utils/pdf.js` — add `generateReceipt`, reusing the private `drawHeader`, `tableHeader`, `tableRow`, `drawFooter` helpers already in that file
- Modify: `sahlearn-api/src/routes/receipts.routes.js`, `sahlearn-api/src/routes/admin.sales.routes.js`, `sahlearn-api/src/controllers/receipts.controller.js`
- Test: `sahlearn-api/tests/integration/receiptPdf.test.js`

**Interfaces:**
- Consumes: `buildReceipt`, `findPaymentByToken` (Task 9).
- Produces:
  - `pdf.js` exports `generateReceipt(res, receipt)` alongside the existing exports.
  - `GET /api/receipts/:token/pdf` (public, `receiptPdfLimiter`)
  - `GET /api/admin/payments/:id/pdf` (admin)

- [ ] **Step 1: Write the failing test**

```js
// sahlearn-api/tests/integration/receiptPdf.test.js
const request = require('supertest');
const app = require('../../src/app');
const { createAdminToken, saleBody } = require('../factories');

let token;
beforeEach(async () => {
  token = await createAdminToken();
});
const auth = (req) => req.set('Authorization', `Bearer ${token}`);

const sellAndPay = async () => {
  const sale = (await auth(request(app).post('/api/admin/sales')).send(saleBody())).body.data;
  const payment = (
    await auth(request(app).post(`/api/admin/sales/${sale.id}/payments`)).send({ amount: 20000, method: 'cash' })
  ).body.data.payment;
  return { sale, payment };
};

describe('receipt PDFs', () => {
  test('the public PDF is a real PDF named after the receipt', async () => {
    const { payment } = await sellAndPay();
    const res = await request(app).get(`/api/receipts/${payment.publicToken}/pdf`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/SAH-R-/);
    // Every PDF file begins with these five bytes.
    expect(res.body.slice(0, 5).toString()).toBe('%PDF-');
  });

  test('the admin PDF works for the same payment', async () => {
    const { payment } = await sellAndPay();
    const res = await auth(request(app).get(`/api/admin/payments/${payment.id}/pdf`));

    expect(res.status).toBe(200);
    expect(res.body.slice(0, 5).toString()).toBe('%PDF-');
  });

  test('the admin PDF needs a token', async () => {
    const { payment } = await sellAndPay();
    const res = await request(app).get(`/api/admin/payments/${payment.id}/pdf`);
    expect(res.status).toBe(401);
  });

  test('404 for an unknown token, without producing a broken file', async () => {
    const res = await request(app).get(`/api/receipts/${'a'.repeat(32)}/pdf`);
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
  });

  test('a voided receipt still renders, so the customer sees it is cancelled', async () => {
    const { payment } = await sellAndPay();
    await auth(request(app).post(`/api/admin/payments/${payment.id}/void`)).send({ reason: 'duplicate' });

    const res = await request(app).get(`/api/receipts/${payment.publicToken}/pdf`);
    expect(res.status).toBe(200);
    expect(res.body.slice(0, 5).toString()).toBe('%PDF-');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sahlearn-api && npx jest tests/integration/receiptPdf.test.js`
Expected: FAIL — both PDF routes 404.

- [ ] **Step 3: Add `generateReceipt` to `pdf.js`**

Add before the `CSV helpers` section, so it can use the private helpers defined above it:

```js
// ── Receipt ─────────────────────────────────────────────────────────────────
const naira = (n) => `NGN ${Number(n || 0).toLocaleString('en-NG')}`;

// `receipt` is the object built by receipts.controller.buildReceipt — the same
// shape the public JSON endpoint returns, so the PDF and the web page can never
// disagree about what a receipt says.
const generateReceipt = (res, receipt) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  sendPDF(res, doc, `${receipt.receiptNo.replace(/\//g, '-')}.pdf`);

  drawHeader(doc, 'Payment Receipt', receipt.receiptNo);

  if (receipt.void) {
    doc.rect(40, doc.y, doc.page.width - 80, 24).fill('#FDE8E8');
    doc.fillColor('#B42318').fontSize(11).font('Helvetica-Bold')
      .text(`VOID — ${receipt.voidReason || 'cancelled'}`, 48, doc.y + 6);
    doc.moveDown(2);
    doc.fillColor(DARK);
  }

  sectionHeading(doc, 'Customer');
  infoRow(doc, 'Name', receipt.customerName);
  infoRow(doc, 'Date', new Date(receipt.paidAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }));
  infoRow(doc, 'Sale', receipt.saleNo);
  infoRow(doc, 'Method', receipt.method);
  if (receipt.reference) infoRow(doc, 'Reference', receipt.reference);

  sectionHeading(doc, 'Items');
  const cols = [
    { label: 'Description', width: 240 },
    { label: 'Qty', width: 50 },
    { label: 'Unit', width: 110 },
    { label: 'Amount', width: 115 },
  ];
  tableHeader(doc, cols);
  receipt.items.forEach((item, i) => {
    tableRow(doc, cols, [item.description, item.quantity, naira(item.unitPrice), naira(item.lineTotal)], i % 2 === 0);
  });

  doc.moveDown(1);
  sectionHeading(doc, 'Summary');
  infoRow(doc, 'Subtotal', naira(receipt.subtotal));
  if (receipt.discountAmount > 0) {
    infoRow(doc, `Discount${receipt.discountReason ? ` (${receipt.discountReason})` : ''}`, `- ${naira(receipt.discountAmount)}`);
  }
  infoRow(doc, 'Total', naira(receipt.total));
  infoRow(doc, 'Paid on this receipt', naira(receipt.amountThisPayment));
  infoRow(doc, 'Paid to date', naira(receipt.totalPaid));
  infoRow(doc, 'Balance', naira(receipt.balance));

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    drawFooter(doc);
  }
  doc.end();
};
```

Add `generateReceipt` to the `module.exports` at the bottom of `pdf.js`.

- [ ] **Step 4: Add the two route handlers**

```js
// sahlearn-api/src/controllers/receipts.controller.js — add
const { generateReceipt } = require('../utils/pdf');

const getPublicReceiptPdf = async (req, res) => {
  const found = await findPaymentByToken(req.params.token);
  if (!found) return res.status(404).json({ status: 'error', message: 'Receipt not found' });
  generateReceipt(res, await buildReceipt(found.sale, found.payment));
};

const getAdminReceiptPdf = async (req, res) => {
  const mongoose = require('mongoose');
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ status: 'error', message: 'Invalid payment id' });
  }
  const payment = await Payment.findById(req.params.id).lean();
  if (!payment) return res.status(404).json({ status: 'error', message: 'Receipt not found' });
  const sale = await Sale.findById(payment.sale).lean();
  if (!sale) return res.status(404).json({ status: 'error', message: 'Receipt not found' });

  generateReceipt(res, await buildReceipt(sale, payment));
};
```

Export both. Then wire them up:

```js
// receipts.routes.js
router.get('/:token/pdf', receiptPdfLimiter, getPublicReceiptPdf);
```

```js
// admin.sales.routes.js — on paymentsRouter
paymentsRouter.get('/:id/pdf', getAdminReceiptPdf);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd sahlearn-api && npx jest tests/integration/receiptPdf.test.js`
Expected: PASS, 5 tests

- [ ] **Step 6: Run the whole backend suite**

Run: `cd sahlearn-api && npx jest`
Expected: every suite passes, including the existing quiz and attendance ones.

- [ ] **Step 7: Commit**

```bash
git add sahlearn-api/src/utils/pdf.js sahlearn-api/src/controllers/receipts.controller.js sahlearn-api/src/routes/receipts.routes.js sahlearn-api/src/routes/admin.sales.routes.js sahlearn-api/tests/integration/receiptPdf.test.js
git commit -m "feat(receipts): render the A4 receipt PDF"
```

---

### Task 11: Frontend services and the sales list

**Files:**
- Create: `sahlearn-web/src/services/adminSales.service.js`, `sahlearn-web/src/services/receipts.service.js`, `sahlearn-web/src/pages/admin/Sales.jsx`
- Modify: `sahlearn-web/src/routes/AppRouter.jsx`, `sahlearn-web/src/components/layout/AdminLayout.jsx`

**Interfaces:**
- Consumes: the endpoints from Tasks 5–10.
- Produces:
  - `adminSales.service.js` exports `listSales({page,limit,status,q})`, `createSale(payload)`, `getSale(id)`, `updateSale(id,payload)`, `voidSale(id,reason)`, `recordPayment(saleId,payload)`, `voidPayment(paymentId,reason)`, `adminReceiptPdfUrl(paymentId)`.
  - `receipts.service.js` exports `getReceipt(token)`, `receiptPdfUrl(token)`, `formatNaira(n)`, `receiptPageUrl(token)`, `whatsappShareUrl(phone, token, receiptNo)`.
  - Route `/admin/sales` → `Sales.jsx`.

- [ ] **Step 1: Write the services**

```js
// sahlearn-web/src/services/adminSales.service.js
import api from './api';

const adminHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('sahlearn_token')}` });

export const listSales = ({ page = 1, limit = 20, status = '', q = '' } = {}) =>
  api
    .get('/api/admin/sales', { params: { page, limit, ...(status && { status }), ...(q && { q }) }, headers: adminHeader() })
    .then((r) => ({ data: r.data.data, meta: r.data.meta }));

export const createSale = (payload) =>
  api.post('/api/admin/sales', payload, { headers: adminHeader() }).then((r) => r.data.data);

export const getSale = (id) =>
  api.get(`/api/admin/sales/${id}`, { headers: adminHeader() }).then((r) => r.data.data);

export const updateSale = (id, payload) =>
  api.patch(`/api/admin/sales/${id}`, payload, { headers: adminHeader() }).then((r) => r.data.data);

export const voidSale = (id, reason) =>
  api.post(`/api/admin/sales/${id}/void`, { reason }, { headers: adminHeader() }).then((r) => r.data.data);

export const recordPayment = (saleId, payload) =>
  api.post(`/api/admin/sales/${saleId}/payments`, payload, { headers: adminHeader() }).then((r) => r.data.data);

export const voidPayment = (paymentId, reason) =>
  api.post(`/api/admin/payments/${paymentId}/void`, { reason }, { headers: adminHeader() }).then((r) => r.data.data);

export const adminReceiptPdfUrl = (paymentId) =>
  `${import.meta.env.VITE_API_URL || ''}/api/admin/payments/${paymentId}/pdf`;
```

```js
// sahlearn-web/src/services/receipts.service.js
import api from './api';

export const getReceipt = (token) => api.get(`/api/receipts/${token}`).then((r) => r.data.data);

export const receiptPdfUrl = (token) => `${import.meta.env.VITE_API_URL || ''}/api/receipts/${token}/pdf`;

// The page a customer opens. Uses the site's own origin, not the API's.
export const receiptPageUrl = (token) =>
  `${import.meta.env.VITE_SITE_URL || window.location.origin}/receipt/${token}`;

export const formatNaira = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`;

// wa.me can only carry text, never a file — which is why the receipt has a page.
export const whatsappShareUrl = (phone, token, receiptNo) => {
  const digits = String(phone || '').replace(/\D/g, '').replace(/^0/, '234');
  const text = encodeURIComponent(
    `Receipt ${receiptNo} from Sahlearn.\nView or download it here: ${receiptPageUrl(token)}`
  );
  return `https://wa.me/${digits}?text=${text}`;
};
```

- [ ] **Step 2: Write the Sales list page**

```jsx
// sahlearn-web/src/pages/admin/Sales.jsx
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Receipt as ReceiptIcon, Plus } from 'lucide-react';
import { listSales } from '../../services/adminSales.service';
import { formatNaira } from '../../services/receipts.service';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';

const PAGE_SIZE = 20;

const STATUS_STYLES = {
  unpaid: 'bg-red-50 text-red-700',
  part_paid: 'bg-amber-50 text-amber-700',
  paid: 'bg-green-50 text-green-700',
  void: 'bg-surface-100 text-ink-500 line-through',
};
const STATUS_LABEL = { unpaid: 'Unpaid', part_paid: 'Part paid', paid: 'Paid', void: 'Void' };

export default function Sales() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listSales({ page, limit: PAGE_SIZE, status, q });
      setRows(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, [page, status, q]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Sales &amp; Receipts</h1>
          <p className="text-xs text-ink-400 mt-0.5">{meta.total} sale{meta.total === 1 ? '' : 's'}</p>
        </div>
        <Link
          to="/admin/sales/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition"
        >
          <Plus size={15} /> New sale
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
          placeholder="Search name, phone or sale number"
          className="flex-1 min-w-[12rem] px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
        <select
          value={status}
          onChange={(e) => { setPage(1); setStatus(e.target.value); }}
          className="px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        >
          <option value="">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="part_paid">Part paid</option>
          <option value="paid">Paid</option>
          <option value="void">Void</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-ink-300/20 overflow-hidden shadow-card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={ReceiptIcon} title="No sales yet" description="Record your first sale to issue a receipt." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50 text-left">
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Sale</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Customer</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Total</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Balance</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-ink-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link to={`/admin/sales/${s.id}`} className="font-mono text-xs text-brand-primary hover:underline">
                        {s.saleNo}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-ink-700">{s.customer?.fullName}</td>
                    <td className="px-5 py-3.5 text-ink-900 font-semibold">{formatNaira(s.total)}</td>
                    <td className="px-5 py-3.5 text-ink-700">{formatNaira(s.balance)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_STYLES[s.status]}`}>
                        {STATUS_LABEL[s.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} pageSize={PAGE_SIZE} onPage={setPage} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the route and the nav entry**

In `AppRouter.jsx`, beside the other admin lazy imports and routes:

```jsx
const AdminSales = lazy(() => import('../pages/admin/Sales'));
// ...
<Route path="sales" element={<AdminSales />} />
```

In `AdminLayout.jsx`, add a `Sales` entry pointing at `/admin/sales` to the nav item list, using the `Receipt` icon from `lucide-react`. Follow the shape of the entries already there.

- [ ] **Step 4: Verify the build**

Run: `cd sahlearn-web && npx vite build`
Expected: builds with no errors.

Run: `cd sahlearn-web && npx eslint src/pages/admin/Sales.jsx src/services/adminSales.service.js src/services/receipts.service.js`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add sahlearn-web/src/services/adminSales.service.js sahlearn-web/src/services/receipts.service.js sahlearn-web/src/pages/admin/Sales.jsx sahlearn-web/src/routes/AppRouter.jsx sahlearn-web/src/components/layout/AdminLayout.jsx
git commit -m "feat(web): add sales list and receipt services"
```

---

### Task 12: The new-sale form

**Files:**
- Create: `sahlearn-web/src/components/admin/SaleItemsEditor.jsx`, `sahlearn-web/src/pages/admin/SaleForm.jsx`
- Modify: `sahlearn-web/src/routes/AppRouter.jsx`

**Interfaces:**
- Consumes: `createSale`, `recordPayment` from `adminSales.service.js`; `formatNaira` from `receipts.service.js`; `listCourses`-style data from the existing admin courses service for the course picker.
- Produces: route `/admin/sales/new`. On save it navigates to `/admin/sales/:id`.
- `SaleItemsEditor` props: `{ items, onChange }` where each item is `{ description, course, quantity, unitPrice }`.

- [ ] **Step 1: Write `SaleItemsEditor`**

```jsx
// sahlearn-web/src/components/admin/SaleItemsEditor.jsx
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
                <option key={c.id} value={c.id}>{c.title}</option>
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
```

- [ ] **Step 2: Write `SaleForm`**

The form collects the customer, the items, an optional discount, and an optional first payment. On submit it calls `createSale`, then — only if an opening payment was entered — `recordPayment`, then navigates to the sale.

Key behaviours to implement:
- Totals shown live, computed in the browser **for display only**; the saved figures come back from the server and the page shows those after saving.
- `studentId` is sent only when non-empty.
- A 404 from `createSale` means an unknown student ID: show it against the student field, not as a page error.
- If `createSale` succeeds but `recordPayment` fails, navigate to the sale anyway and toast the payment error — the sale exists and must not be lost or duplicated by a retry.

```jsx
// sahlearn-web/src/pages/admin/SaleForm.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createSale, recordPayment } from '../../services/adminSales.service';
import { listCourses } from '../../services/adminCourses.service';
import { formatNaira } from '../../services/receipts.service';
import SaleItemsEditor, { emptyItem } from '../../components/admin/SaleItemsEditor';

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
    listCourses({ limit: 100 })
      .then((res) => setCourses(res.data || []))
      .catch(() => setCourses([]));   // the picker is a convenience, not a requirement
  }, []);

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
      if (!Number.isInteger(item.quantity) || item.quantity < 1) errors[`item${i}`] = `Item ${i + 1}: quantity must be 1 or more`;
      if (!Number.isInteger(item.unitPrice) || item.unitPrice < 0) errors[`item${i}`] = `Item ${i + 1}: price must be a whole number`;
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
        ...(discountAmount > 0 && { discount: { type: discount.type, value: Number(discount.value), reason: discount.reason.trim() } }),
      });
    } catch (err) {
      const body = err.response?.data;
      if (err.response?.status === 404) setFieldErrors({ studentId: body?.message });
      else if (Array.isArray(body?.errors)) {
        setFieldErrors(body.errors.reduce((acc, e2) => ({ ...acc, [e2.field]: e2.message }), {}));
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

      <section className="bg-white rounded-2xl border border-ink-300/20 p-6 space-y-4 shadow-card">
        <h2 className="font-semibold text-ink-900">Customer</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Name</label>
            <input
              value={customer.fullName}
              onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
            {fieldErrors.fullName && <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Phone</label>
            <input
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              placeholder="08012345678"
              className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
            {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-ink-600 mb-1">
              Student ID <span className="font-normal text-ink-400">(optional — links this sale to their dashboard)</span>
            </label>
            <input
              value={customer.studentId}
              onChange={(e) => setCustomer({ ...customer, studentId: e.target.value })}
              className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
            {fieldErrors.studentId && <p className="text-xs text-red-600 mt-1">{fieldErrors.studentId}</p>}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-ink-300/20 p-6 space-y-4 shadow-card">
        <h2 className="font-semibold text-ink-900">Items</h2>
        <SaleItemsEditor items={items} onChange={setItems} courses={courses} />
        {Object.keys(fieldErrors).filter((k) => k.startsWith('item')).map((k) => (
          <p key={k} className="text-xs text-red-600">{fieldErrors[k]}</p>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-ink-300/20 p-6 space-y-4 shadow-card">
        <h2 className="font-semibold text-ink-900">Discount <span className="font-normal text-xs text-ink-400">(optional)</span></h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <select
            value={discount.type}
            onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
            className="px-3 py-2 border border-surface-300 rounded-xl text-sm"
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
            className="px-3 py-2 border border-surface-300 rounded-xl text-sm"
          />
          <input
            value={discount.reason}
            onChange={(e) => setDiscount({ ...discount, reason: e.target.value })}
            placeholder="Reason, e.g. scholarship"
            className="px-3 py-2 border border-surface-300 rounded-xl text-sm"
          />
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-ink-300/20 p-6 space-y-2 shadow-card">
        <div className="flex justify-between text-sm"><span className="text-ink-500">Subtotal</span><span>{formatNaira(subtotal)}</span></div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm"><span className="text-ink-500">Discount</span><span>− {formatNaira(discountAmount)}</span></div>
        )}
        <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatNaira(total)}</span></div>
        <p className="text-[11px] text-ink-400 pt-1">Final figures are calculated on the server when you save.</p>
      </section>

      <section className="bg-white rounded-2xl border border-ink-300/20 p-6 space-y-4 shadow-card">
        <h2 className="font-semibold text-ink-900">Payment now <span className="font-normal text-xs text-ink-400">(leave as 0 if nothing was paid yet)</span></h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            type="number"
            min={0}
            step={1}
            value={opening.amount}
            onChange={(e) => setOpening({ ...opening, amount: parseInt(e.target.value, 10) || 0 })}
            className="px-3 py-2 border border-surface-300 rounded-xl text-sm"
          />
          <select
            value={opening.method}
            onChange={(e) => setOpening({ ...opening, method: e.target.value })}
            className="px-3 py-2 border border-surface-300 rounded-xl text-sm"
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
            className="px-3 py-2 border border-surface-300 rounded-xl text-sm"
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
```

If `adminCourses.service.js` exports a differently named list function, use that name — check the file rather than assuming.

- [ ] **Step 3: Add the route**

```jsx
const AdminSaleForm = lazy(() => import('../pages/admin/SaleForm'));
// ...
<Route path="sales/new" element={<AdminSaleForm />} />
```

- [ ] **Step 4: Verify the build**

Run: `cd sahlearn-web && npx vite build`
Expected: builds with no errors.

- [ ] **Step 5: Commit**

```bash
git add sahlearn-web/src/components/admin/SaleItemsEditor.jsx sahlearn-web/src/pages/admin/SaleForm.jsx sahlearn-web/src/routes/AppRouter.jsx
git commit -m "feat(web): add the new sale form"
```

---

### Task 13: Sale detail, recording payments and the receipt actions

**Files:**
- Create: `sahlearn-web/src/components/receipt/ReceiptView.jsx`, `sahlearn-web/src/components/receipt/ShareReceiptButtons.jsx`, `sahlearn-web/src/pages/admin/SaleDetail.jsx`
- Modify: `sahlearn-web/src/routes/AppRouter.jsx`

**Interfaces:**
- `ReceiptView` props: `{ receipt }` — the object the public endpoint returns (Task 9). Used by both the admin screen and the public page so the two cannot drift.
- `ShareReceiptButtons` props: `{ token, receiptNo, phone }`. Renders Print, PDF, WhatsApp and — only when `navigator.canShare?.({ files: [...] })` is true — Share.
- Route `/admin/sales/:id`.

- [ ] **Step 1: Write `ReceiptView`**

```jsx
// sahlearn-web/src/components/receipt/ReceiptView.jsx
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

      <div className="space-y-1 text-sm border-t border-ink-300/30 pt-3">
        <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{formatNaira(receipt.subtotal)}</span></div>
        {receipt.discountAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-ink-500">Discount{receipt.discountReason ? ` (${receipt.discountReason})` : ''}</span>
            <span>− {formatNaira(receipt.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold"><span>Total</span><span>{formatNaira(receipt.total)}</span></div>
        <div className="flex justify-between text-brand-primary font-semibold">
          <span>Paid on this receipt</span><span>{formatNaira(receipt.amountThisPayment)}</span>
        </div>
        <div className="flex justify-between"><span className="text-ink-500">Paid to date</span><span>{formatNaira(receipt.totalPaid)}</span></div>
        <div className="flex justify-between font-semibold"><span>Balance</span><span>{formatNaira(receipt.balance)}</span></div>
      </div>

      <p className="text-xs text-ink-400">
        Paid by {receipt.method}{receipt.reference ? ` · ${receipt.reference}` : ''} · Sale {receipt.saleNo}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Write `ShareReceiptButtons`**

```jsx
// sahlearn-web/src/components/receipt/ShareReceiptButtons.jsx
import { useEffect, useState } from 'react';
import { Printer, Download, Share2, MessageCircle } from 'lucide-react';
import { receiptPdfUrl, whatsappShareUrl } from '../../services/receipts.service';

export default function ShareReceiptButtons({ token, receiptNo, phone }) {
  // Sharing a FILE is not supported everywhere, so the button only appears
  // where it will actually work rather than failing when pressed.
  const [canShareFiles, setCanShareFiles] = useState(false);
  useEffect(() => {
    try {
      const probe = new File(['probe'], 'probe.pdf', { type: 'application/pdf' });
      setCanShareFiles(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

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
```

- [ ] **Step 3: Write `SaleDetail`**

Requirements for this page:
- Loads the sale via `getSale(id)` and shows customer, items, totals, status and the payment history.
- A **Record payment** form: amount, method, reference. Disabled when the balance is zero or the sale is void. On success it reloads the sale and shows the new receipt's actions.
- Each payment row shows receipt number, date, amount, method, and — for non-voided ones — `ShareReceiptButtons` plus a **Void** action that prompts for a reason.
- A **Void sale** action that prompts for a reason and reloads.
- Voided payments render struck through with their reason.
- Errors from the API are shown as toasts; a 422 on the payment amount is shown against the amount field.

- [ ] **Step 4: Add the route**

```jsx
const AdminSaleDetail = lazy(() => import('../pages/admin/SaleDetail'));
// ...
<Route path="sales/:id" element={<AdminSaleDetail />} />
```

- [ ] **Step 5: Verify the build**

Run: `cd sahlearn-web && npx vite build`
Expected: builds with no errors.

- [ ] **Step 6: Commit**

```bash
git add sahlearn-web/src/components/receipt sahlearn-web/src/pages/admin/SaleDetail.jsx sahlearn-web/src/routes/AppRouter.jsx
git commit -m "feat(web): add sale detail, payment recording and receipt sharing"
```

---

### Task 14: The public receipt page

**Files:**
- Create: `sahlearn-web/src/pages/public/Receipt.jsx`
- Modify: `sahlearn-web/src/routes/AppRouter.jsx`, `sahlearn-web/index.html` or the SEO component as needed for `noindex`

**Interfaces:**
- Consumes: `getReceipt(token)` (Task 11), `ReceiptView`, `ShareReceiptButtons` (Task 13).
- Produces: route `/receipt/:token`, public, outside the admin and student layouts.

- [ ] **Step 1: Write the page**

```jsx
// sahlearn-web/src/pages/public/Receipt.jsx
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
```

If the existing `SEO` component has no `noindex` prop, add one that renders `<meta name="robots" content="noindex" />`.

- [ ] **Step 2: Add the route outside the admin and student layouts**

```jsx
const PublicReceipt = lazy(() => import('../pages/public/Receipt'));
// ...
<Route path="/receipt/:token" element={<PublicReceipt />} />
```

- [ ] **Step 3: Confirm `robots.txt` disallows it**

Check `sahlearn-web/public/robots.txt`. If it has explicit `Disallow` lines, add `Disallow: /receipt/`.

- [ ] **Step 4: Verify the build**

Run: `cd sahlearn-web && npx vite build`
Expected: builds with no errors.

- [ ] **Step 5: Commit**

```bash
git add sahlearn-web/src/pages/public/Receipt.jsx sahlearn-web/src/routes/AppRouter.jsx sahlearn-web/public/robots.txt
git commit -m "feat(web): add the public receipt page"
```

---

### Task 15: The student's own receipts (Phase 2)

**Files:**
- Create: `sahlearn-api/src/controllers/student.receipts.controller.js`, `sahlearn-api/src/routes/student.receipts.routes.js`, `sahlearn-web/src/pages/student/Payments.jsx`
- Modify: `sahlearn-api/src/app.js`, `sahlearn-web/src/routes/AppRouter.jsx`, `sahlearn-web/src/components/layout/StudentLayout.jsx`
- Test: `sahlearn-api/tests/integration/studentReceipts.test.js`

**Interfaces:**
- Produces: `GET /api/student/receipts?page=&limit=` → the caller's own receipts, newest first, with `meta` and `summary: { totalPaid, outstanding }`.

- [ ] **Step 1: Write the failing test**

```js
// sahlearn-api/tests/integration/studentReceipts.test.js
const request = require('supertest');
const app = require('../../src/app');
const { createAdminToken, createStudent, createStudentToken, saleBody } = require('../factories');

let adminToken;
beforeEach(async () => {
  adminToken = await createAdminToken();
});
const asAdmin = (req) => req.set('Authorization', `Bearer ${adminToken}`);

const sellTo = async (student, { amount = 20000, unitPrice = 50000 } = {}) => {
  const sale = (
    await asAdmin(request(app).post('/api/admin/sales')).send(
      saleBody({ studentId: student.studentId, items: [{ description: 'Course', quantity: 1, unitPrice }] })
    )
  ).body.data;
  if (amount > 0) {
    await asAdmin(request(app).post(`/api/admin/sales/${sale.id}/payments`)).send({ amount, method: 'cash' });
  }
  return sale;
};

describe('GET /api/student/receipts', () => {
  test('401 without a student token', async () => {
    const res = await request(app).get('/api/student/receipts');
    expect(res.status).toBe(401);
  });

  test('returns only the calling student\'s receipts', async () => {
    const mine = await createStudent();
    const theirs = await createStudent();
    await sellTo(mine);
    await sellTo(theirs);

    const res = await request(app)
      .get('/api/student/receipts')
      .set('Authorization', `Bearer ${createStudentToken(mine)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ amount: 20000, balance: 30000 });
  });

  test('summarises what they have paid and what is outstanding', async () => {
    const student = await createStudent();
    await sellTo(student, { amount: 20000, unitPrice: 50000 });
    await sellTo(student, { amount: 5000, unitPrice: 5000 });

    const res = await request(app)
      .get('/api/student/receipts')
      .set('Authorization', `Bearer ${createStudentToken(student)}`);

    expect(res.body.summary).toMatchObject({ totalPaid: 25000, outstanding: 30000 });
  });

  test('voided receipts are excluded and voided sales do not count as outstanding', async () => {
    const student = await createStudent();
    const sale = await sellTo(student);
    await asAdmin(request(app).post(`/api/admin/sales/${sale.id}/void`)).send({ reason: 'cancelled' });

    const res = await request(app)
      .get('/api/student/receipts')
      .set('Authorization', `Bearer ${createStudentToken(student)}`);

    expect(res.body.data).toHaveLength(0);
    expect(res.body.summary).toMatchObject({ totalPaid: 0, outstanding: 0 });
  });

  test('a student with no sales gets an empty list, not an error', async () => {
    const student = await createStudent();
    const res = await request(app)
      .get('/api/student/receipts')
      .set('Authorization', `Bearer ${createStudentToken(student)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.summary).toMatchObject({ totalPaid: 0, outstanding: 0 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd sahlearn-api && npx jest tests/integration/studentReceipts.test.js`
Expected: FAIL — route 404s (or 401 from the generic `/api/student` router, which is the mount-order trap).

- [ ] **Step 3: Write the controller**

```js
// sahlearn-api/src/controllers/student.receipts.controller.js
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');

const getMyReceipts = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);

  const sales = await Sale.find({ 'customer.student': req.student._id, voidedAt: null }).lean();
  const saleIds = sales.map((s) => s._id);
  const saleById = new Map(sales.map((s) => [String(s._id), s]));

  const filter = { sale: { $in: saleIds }, voidedAt: null };
  const [total, payments] = await Promise.all([
    Payment.countDocuments(filter),
    Payment.find(filter).sort({ paidAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  const summary = sales.reduce(
    (acc, s) => ({
      totalPaid: acc.totalPaid + (s.amountPaid || 0),
      outstanding: acc.outstanding + Math.max((s.total || 0) - (s.amountPaid || 0), 0),
    }),
    { totalPaid: 0, outstanding: 0 }
  );

  res.status(200).json({
    status: 'success',
    data: payments.map((p) => {
      const sale = saleById.get(String(p.sale));
      return {
        id: p._id,
        receiptNo: p.receiptNo,
        token: p.publicToken,
        paidAt: p.paidAt,
        amount: p.amount,
        method: p.method,
        saleNo: sale?.saleNo,
        description: sale?.items?.[0]?.description || 'Payment',
        total: sale?.total || 0,
        balance: Math.max((sale?.total || 0) - (sale?.amountPaid || 0), 0),
      };
    }),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    summary,
  });
};

module.exports = { getMyReceipts };
```

- [ ] **Step 4: Route and mount it ABOVE the generic `/api/student`**

```js
// sahlearn-api/src/routes/student.receipts.routes.js
const express = require('express');
const router = express.Router();
const studentAuth = require('../middleware/studentAuth');
const { getMyReceipts } = require('../controllers/student.receipts.controller');

router.use(studentAuth);
router.get('/', getMyReceipts);

module.exports = router;
```

```js
// app.js — MUST be above `app.use('/api/student', studentRoutes)`
app.use('/api/student/daily-quiz', studentDailyQuizRoutes);
app.use('/api/student/receipts', studentReceiptsRoutes);   // ← add here
app.use('/api/student', studentRoutes);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd sahlearn-api && npx jest tests/integration/studentReceipts.test.js`
Expected: PASS, 5 tests

- [ ] **Step 6: Build the student page**

`sahlearn-web/src/pages/student/Payments.jsx`: a `<h1>Payments</h1>`, two stat cards (total paid, outstanding), and a table of receipts — date, description, amount, balance — each row linking to `/receipt/<token>`. Follow the layout of `src/pages/student/DailyQuizHistory.jsx`, which already does exactly this shape. Add `getMyReceipts` to `receipts.service.js` using the student token header pattern from `dailyQuiz.service.js`. Add the route `<Route path="payments" element={<StudentPayments />} />` under the student routes and a nav entry in `StudentLayout.jsx`.

- [ ] **Step 7: Verify both builds**

Run: `cd sahlearn-api && npx jest` — every suite passes.
Run: `cd sahlearn-web && npx vite build` — builds with no errors.

- [ ] **Step 8: Commit**

```bash
git add sahlearn-api/src/controllers/student.receipts.controller.js sahlearn-api/src/routes/student.receipts.routes.js sahlearn-api/src/app.js sahlearn-api/tests/integration/studentReceipts.test.js sahlearn-web/src/pages/student/Payments.jsx sahlearn-web/src/services/receipts.service.js sahlearn-web/src/routes/AppRouter.jsx sahlearn-web/src/components/layout/StudentLayout.jsx
git commit -m "feat(sales): show students their own receipts and balance"
```

---

### Task 16: QA checklist and documentation

**Files:**
- Create: `docs/SALES_RECEIPTS_QA.md`

- [ ] **Step 1: Write the checklist**

A numbered list a human runs in a browser, covering at minimum: creating a sale paid in full; creating a part-paid sale and completing it in two more instalments with the balance correct at each step; attempting to overpay and being refused; attempting to edit items after payment and getting the conflict message; voiding a receipt and seeing the balance restored; voiding a sale; opening the WhatsApp link and confirming the text and URL; opening the receipt link in a private window and confirming **no phone number appears anywhere in the page source**; downloading the PDF; the share button appearing on a phone and not on a desktop; a student logging in and seeing their receipts and balance; and printing the public page.

State plainly at the top that none of it was verified in a browser by the implementer.

- [ ] **Step 2: Commit**

```bash
git add docs/SALES_RECEIPTS_QA.md
git commit -m "docs: add sales and receipts QA checklist"
```

---

## Self-Review

**1. Spec coverage.** Every section of the spec maps to a task: data model → 3; numbering → 2; money rules → 1; recompute → 4; admin API → 5, 6, 7, 8, 11; public receipt → 9; PDF → 10; sharing → 13; screens → 11–14; student view → 15; error table → tested across 5–9; testing section → each task's tests. The spec's `GET /api/admin/sales/summary` is **not** implemented: it exists only to feed a dashboard widget that is not in this plan's screens, so it is deferred rather than half-built. Everything else in §6 is covered.

**2. Placeholder scan.** No TBDs. Task 13 Step 3 and Task 15 Step 6 describe screens in prose rather than full code — both are compositions of components whose code is given in full in the same or an earlier task, and both name every behaviour required. Task 16 is a document, so prose is the deliverable.

**3. Type consistency.** `computeTotals`/`lineTotal`/`deriveStatus` (Task 1) are used with those exact names in Task 3. `nextSaleNo`/`nextReceiptNo` (Task 2) in Tasks 5 and 7. `recomputeSale`/`outstandingBalance` (Task 4) in Tasks 7 and 8. `buildReceipt`/`findPaymentByToken` (Task 9) in Task 10. The receipt payload shape in Task 9 is the same object consumed by `generateReceipt` in Task 10 and `ReceiptView` in Task 13. Service function names in Task 11 match every call site in Tasks 12–14.

**4. Review Focus.** All five are pinned: discount overshoot → Task 1; junk numbers → Tasks 5 and 7; concurrent numbering → Tasks 2 and 7; client-sent totals → Task 5; malformed token → Task 9.
