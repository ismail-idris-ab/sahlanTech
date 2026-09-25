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
