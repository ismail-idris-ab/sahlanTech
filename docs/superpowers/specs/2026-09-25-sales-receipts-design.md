# Sales & Receipts — Design

Date: 2026-09-25
Status: Approved (design), pending implementation plan

## 1. Intent

Let the admin record what was sold — a course, a laptop, a textbook, a service —
take payment in full or in instalments, and issue the customer a numbered
receipt they can print, download or receive on WhatsApp.

Goals:
- Issuing a receipt takes under a minute, including for a walk-in buyer with no
  student account.
- A customer paying in three instalments gets three receipts that reconcile
  against one running balance, with no mental arithmetic by the admin.
- The admin can answer "what does this person still owe?" from the dashboard.

Success criteria:
- A part-paid sale shows the correct balance after every payment, always.
- A receipt shared on WhatsApp opens on the customer's phone and matches the
  admin's records exactly.
- Nothing already recorded changes when a later payment is added.

## 2. Decisions taken

| Question | Decision |
|---|---|
| Part-payments | A sale holds the items; each payment is its own row with its own receipt |
| Line items | Free typing, with existing courses pickable to prefill the description |
| Customer | Name and phone, optionally linked to a student account |
| Delivery | WhatsApp link, PDF download / print, and the phone's native share sheet |
| Public receipt page | Shows everything except the customer's phone number |
| Corrections | Issued receipts are never edited — void and reissue |
| Discounts | One per sale, fixed amount or percentage, with an optional reason |
| Student view | Students see their own receipts and outstanding balance |

### Assumption, open to correction

**A4 PDF, not 80mm thermal.** The existing `utils/pdf.js` is A4 and the receipt
reuses it. Thermal roll printers need a different page size and layout; adding
one later means a second template, not a rewrite. This was asked and not
answered, so A4 is the default rather than a decision.

## 3. Why two collections, not one

A receipt documents *a payment*, not a sale. Storing one record per receipt with
a typed-in `balance` breaks the moment a second instalment is taken: nothing
connects the two rows, and the balances drift apart silently. That failure is
invisible until a customer produces a receipt that disagrees with the records.

So: `Sale` owns what was bought and what it costs. `Payment` owns each sum of
money received. The balance is derived from both and never typed.

## 4. Data model

Two new Mongoose models in `sahlearn-api/src/models/`.

### `Sale`

```
saleNo        String   'SAH/S/2026/0001'  — required, unique, sequential
customer      { fullName, phone, student? ref Student }
items         [saleItemSchema]            — 1..20 entries
discount      { type: 'amount'|'percent', value: Number, reason: String }
subtotal      Number   computed pre-save
discountAmount Number  computed pre-save
total         Number   computed pre-save
amountPaid    Number   maintained from Payment rows
balance       Number   total - amountPaid, maintained with amountPaid
status        String   enum ['unpaid','part_paid','paid','void']
notes         String   max 500
issuedBy      ObjectId ref User            — which admin raised it
voidedAt      Date
voidReason    String   max 200
timestamps
```

`saleItemSchema`:

```
description   String   required, max 200
course        ObjectId ref Course          — optional, set when picked from the list
quantity      Number   required, min 1, integer
unitPrice     Number   required, min 0, integer
lineTotal     Number   computed  (quantity * unitPrice)
```

### `Payment`

```
sale          ObjectId ref Sale    required
receiptNo     String   'SAH/R/2026/0001'  — required, unique, sequential
amount        Number   required, min 1, integer
method        String   enum ['cash','transfer','pos','other']
reference     String   max 100     — teller number, transfer ref, POS stub
paidAt        Date     required    — defaults to now, admin may back-date
publicToken   String   required, unique, indexed  — 32 random hex, the share link
recordedBy    ObjectId ref User
voidedAt      Date
voidReason    String   max 200
timestamps
```

Indexes:
- `Sale`: `{ saleNo: 1 }` unique; `{ 'customer.student': 1, createdAt: -1 }`;
  `{ status: 1, createdAt: -1 }`; `{ 'customer.phone': 1 }`.
- `Payment`: `{ receiptNo: 1 }` unique; `{ publicToken: 1 }` unique;
  `{ sale: 1, paidAt: 1 }`.

Both use the project's standard `toJSON` transform. `Sale` additionally drops
nothing; the public receipt payload is built field by field in the controller,
never by serializing the document, so the phone cannot leak by accident.

### Money is stored as whole naira integers

No kobo, no decimals, therefore no floating-point drift — `0.1 + 0.2` is not a
problem that can exist here. Every amount is validated as an integer. If kobo is
ever needed, the migration is to multiply by 100 and store minor units; the
field types do not change.

### Numbering

Reuses the `nextSeq()` + `Counter` pattern already in
`enrollments.controller.js`. Counter keys are per document type and per year, so
numbering restarts each January and the year is visible in the number:

```
sale-2026    -> SAH/S/2026/0001
receipt-2026 -> SAH/R/2026/0001
```

A voided receipt keeps its number. Numbers are never reused — a gap in the
sequence is the correct record of a voided document.

## 5. Rules

These are the behaviours that keep the records honest. Each one is a test.

**Server computes every figure.** The client sends items, discount and payment
amounts. It never sends `subtotal`, `total` or `balance`, and any such field in
the request body is ignored. Same rule as daily-quiz scoring.

**A payment cannot exceed the outstanding balance.** Refused with 422 and a
message naming the balance. Overpayment is a refund problem, and refunds are out
of scope for this build.

**A sale's items and discount lock once a payment exists.** 409, because
changing what was sold after money changed hands would invalidate a receipt the
customer already holds. This mirrors the daily quiz's rule about editing
questions after an attempt. `notes` and the customer's own details stay
editable.

**Issued receipts are never edited.** A `PATCH` on a payment does not exist. A
mistake is voided with a reason and a corrected receipt is issued.

**Voiding recalculates.** Voiding a payment recomputes the sale's `amountPaid`,
`balance` and `status` from the surviving payments — recomputed from the rows,
never decremented, so re-voiding cannot drift the total. Voiding a sale voids
its payments.

**Status is derived, not set.** `unpaid` when nothing is paid, `part_paid` while
a balance remains, `paid` at zero balance, `void` when voided.

## 6. API

Envelopes follow CLAUDE.md §10.

### Admin — existing admin JWT, `role === 'admin'`

- `GET    /api/admin/sales` — paginated, newest first. Filters: `status`,
  `q` (customer name, phone or saleNo), `from`, `to`.
- `POST   /api/admin/sales` — creates a sale. Optionally accepts a first
  payment in the same request, since most sales are paid on the spot.
- `GET    /api/admin/sales/:id` — the sale with its payments.
- `PATCH  /api/admin/sales/:id` — items and discount only while no payment
  exists (409 otherwise); notes and customer details always.
- `POST   /api/admin/sales/:id/void` — body `{ reason }`.
- `POST   /api/admin/sales/:id/payments` — records a payment, issues the
  receipt, returns it including its `publicToken` and share URL.
- `POST   /api/admin/payments/:id/void` — body `{ reason }`.
- `GET    /api/admin/payments/:id/pdf` — the A4 receipt.
- `GET    /api/admin/sales/summary` — totals for the dashboard: sold, collected,
  outstanding, for a date range.

### Public — no auth, token in the path

- `GET /api/receipts/:token` — one receipt for the share link. Returns receipt
  number, date, customer **name only**, items, subtotal, discount, total, this
  payment's amount, total paid so far, balance, method, and the business's
  contact details. **Never the phone, never the student ID, never internal ids.**
  A voided receipt returns 200 with `void: true` so the page can say so plainly
  rather than 404-ing on a link the customer already has.
- `GET /api/receipts/:token/pdf` — the same as a PDF, for the share sheet.

An unknown token returns 404 with a generic message. The token is 32 hex
characters from `crypto.randomBytes(16)`, so it cannot be enumerated.

### Student — existing student JWT

- `GET /api/student/receipts` — the caller's own receipts, newest first,
  paginated, plus `summary: { totalPaid, outstanding }` across their sales.

### Rate limiting (CLAUDE.md §17)

| Endpoint | Limit |
|---|---|
| `GET /api/receipts/:token` | 60 / 15 min / IP |
| `GET /api/receipts/:token/pdf` | 20 / 15 min / IP |

Admin endpoints sit behind auth and take the global limiter.

## 7. Flows

**Paid in full, walk-in customer.** Admin opens New Sale, types the customer's
name and phone, adds "HP EliteBook 840 G5" ×1 at ₦185,000, records a ₦185,000
cash payment in the same form, and saves. One request creates the sale and its
first receipt. The receipt screen offers Print, PDF, WhatsApp and Share.

**Part payment, existing student.** Admin picks the course from the list, which
fills the description; types the agreed price; links the student by searching
their name. Records ₦20,000 of ₦50,000. The sale shows `part_paid`, balance
₦30,000. The receipt reads "Paid today ₦20,000 · Total ₦50,000 · Balance
₦30,000". Three weeks later the admin opens the sale and records ₦30,000: a
second receipt, balance zero, status `paid`. The student sees both on their
dashboard.

**Mistake.** A receipt was raised for the wrong customer. Admin voids it with a
reason, and the sale's balance returns to what it was. A corrected receipt is
issued with the next number. The voided one stays in the list, struck through.

## 8. Sharing

**WhatsApp** uses a `wa.me` link with prefilled text — it cannot attach a file,
which is why the public receipt page exists:

```
https://wa.me/<customer phone>?text=<encoded message with the receipt URL>
```

**Share sheet** uses the Web Share API with the PDF as a file, so the customer
gets the actual document. Available on modern Android and iOS browsers only, so
the button is hidden when `navigator.canShare` reports it cannot take files.

**Print** uses the A4 PDF. The public receipt page also carries print styles so
`Ctrl+P` on it produces something sensible without downloading anything.

### What appears at the top of a receipt

The PDF reuses `drawHeader` from `utils/pdf.js`, which already carries the
Sahlearn wordmark and brand colours. Business contact details — address, phone,
email — are read from the existing `SiteContent` key/value store if present and
omitted if not, so the receipt never prints an empty label. A dedicated
`site-content` key for receipt details keeps them editable from the admin
dashboard without a deploy.

## 9. Frontend

Paths follow the existing `sahlearn-web/src` layout.

- `pages/admin/Sales.jsx` — list with status, customer, total, balance
- `pages/admin/SaleForm.jsx` — new sale, with the optional first payment
- `pages/admin/SaleDetail.jsx` — items, payment history, Record Payment, void
- `components/admin/SaleItemsEditor.jsx` — the line-item rows and live totals
- `components/receipt/ReceiptView.jsx` — the receipt itself, shared by the admin
  screen and the public page so they cannot drift apart
- `components/receipt/ShareReceiptButtons.jsx` — Print, PDF, WhatsApp, Share
- `pages/public/Receipt.jsx` — route `/receipt/:token`, outside the main layout,
  `noindex`
- `pages/student/Payments.jsx` — the student's own receipts and balance
- `services/adminSales.service.js`, `services/receipts.service.js`

Totals shown while typing are calculated in the browser for feedback only. The
figures that are saved and printed are the server's.

## 10. Error handling

| Case | Code |
|---|---|
| Payment greater than the outstanding balance | 422, message names the balance |
| Editing items or discount after a payment exists | 409 |
| Voiding an already-voided sale or payment | 409 |
| Payment against a voided sale | 409 |
| Unknown or malformed receipt token | 404, generic |
| Validation failure | 422 with the `errors` array |
| Rate limit | 429 |

## 11. Testing

- Totals: quantity × price, subtotal, percentage discount, fixed discount, and a
  discount larger than the subtotal (floors at zero, never negative).
- Balance after one, two and three part-payments.
- A payment of exactly the balance closes the sale; one naira more is refused.
- Voiding the middle payment of three recomputes the balance correctly.
- Items locked once a payment exists; notes still editable.
- The public receipt payload contains no phone number, student ID or Mongo id —
  asserted against the serialized JSON, the way the quiz leak tests work.
- An unknown token 404s; a voided receipt returns 200 with `void: true`.
- Sequential numbering does not collide under concurrent creation.
- Client-supplied `total` or `balance` in a request body is ignored.

## 12. Phasing

**Phase 1** — models, numbering, sale and payment endpoints, admin screens,
receipt PDF, public receipt page, WhatsApp and share. Usable on its own.

**Phase 2** — the student-facing Payments screen and dashboard summary.

## 13. Out of scope

Deliberately excluded; each needs its own request:

- Refunds and credit notes. Overpayment is refused rather than handled.
- Online payment collection. Paystack is not part of this; payments are recorded
  after the fact.
- Stock or inventory. Items are typed, not counted.
- A product catalogue. Decided against: free typing plus pickable courses.
- Making `Course.price` numeric. It stays free text; picking a course prefills
  the description and the price is confirmed as a number by the admin. Parsing
  money out of `"₦50,000"` is how a ₦50,000 course gets sold for ₦50.
- Thermal receipt printing, per the assumption in §2.
- Tax or VAT lines.
- Emailing receipts. The mail credentials are unset in production, so it would
  silently do nothing.
