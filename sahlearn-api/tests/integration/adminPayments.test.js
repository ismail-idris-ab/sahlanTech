const request = require('supertest');
const app = require('../../src/app');
const Sale = require('../../src/models/Sale');
const Payment = require('../../src/models/Payment');
const { createAdminToken, saleBody } = require('../factories');

let token;
beforeEach(async () => {
  token = await createAdminToken();
});
const auth = (req) => req.set('Authorization', `Bearer ${token}`);

// The default factory sale totals 50000.
const newSale = async (overrides) =>
  (await auth(request(app).post('/api/admin/sales')).send(saleBody(overrides))).body.data;
const pay = (sale, body) => auth(request(app).post(`/api/admin/sales/${sale.id}/payments`)).send(body);
const voidPayment = (payment, reason = 'entered twice') =>
  auth(request(app).post(`/api/admin/payments/${payment.id}/void`)).send({ reason });

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
    expect((await pay(sale, { amount: 30000, method: 'cash' })).status).toBe(422);
  });

  // Review Focus 2
  test('422, not 500, for junk amounts', async () => {
    const sale = await newSale();
    for (const amount of [0, -100, 1.5, 'lots', null, [], {}]) {
      expect((await pay(sale, { amount, method: 'cash' })).status).toBe(422);
    }
  });

  test('422 for an unknown payment method', async () => {
    const sale = await newSale();
    expect((await pay(sale, { amount: 100, method: 'crypto' })).status).toBe(422);
  });

  test('409 when paying against a voided sale', async () => {
    const sale = await newSale();
    await auth(request(app).post(`/api/admin/sales/${sale.id}/void`)).send({ reason: 'cancelled' });
    expect((await pay(sale, { amount: 100, method: 'cash' })).status).toBe(409);
  });

  test('404 for an unknown sale and 400 for a malformed id', async () => {
    const body = { amount: 100, method: 'cash' };
    expect(
      (await auth(request(app).post('/api/admin/sales/650000000000000000000000/payments')).send(body)).status
    ).toBe(404);
    expect((await auth(request(app).post('/api/admin/sales/not-an-id/payments')).send(body)).status).toBe(400);
  });

  test('accepts a back-dated payment', async () => {
    const sale = await newSale();
    const paidAt = new Date('2026-09-01T10:00:00.000Z').toISOString();
    const res = await pay(sale, { amount: 100, method: 'cash', paidAt });
    expect(new Date(res.body.data.payment.paidAt).toISOString()).toBe(paidAt);
  });

  // Review Focus 3
  test('simultaneous payments get distinct receipt numbers', async () => {
    const sale = await newSale();
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

describe('POST /api/admin/payments/:id/void', () => {
  const payFor = async (sale, amount) => (await pay(sale, { amount, method: 'cash' })).body.data.payment;

  test('voids the receipt and restores the balance', async () => {
    const sale = await newSale();
    const payment = await payFor(sale, 20000);

    const res = await voidPayment(payment);
    expect(res.status).toBe(200);
    expect(res.body.data.payment.voidedAt).not.toBeNull();
    expect(res.body.data.sale.amountPaid).toBe(0);
    expect(res.body.data.sale.balance).toBe(50000);
    expect(res.body.data.sale.status).toBe('unpaid');
  });

  test('voiding the middle payment of three leaves the others intact', async () => {
    const sale = await newSale();
    await payFor(sale, 10000);
    const middle = await payFor(sale, 20000);
    await payFor(sale, 5000);

    const res = await voidPayment(middle);
    expect(res.body.data.sale.amountPaid).toBe(15000);
    expect(res.body.data.sale.status).toBe('part_paid');
  });

  test('the receipt number is kept, not reused', async () => {
    const sale = await newSale();
    const payment = await payFor(sale, 10000);
    await voidPayment(payment);
    const next = await payFor(sale, 10000);
    expect(next.receiptNo).not.toBe(payment.receiptNo);
  });

  test('409 when voiding the same payment twice, and the balance does not drift', async () => {
    const sale = await newSale();
    const payment = await payFor(sale, 20000);
    await voidPayment(payment);

    expect((await voidPayment(payment)).status).toBe(409);

    const after = await Sale.findById(sale.id);
    expect(after.amountPaid).toBe(0);
    expect(after.balance).toBe(50000);
  });

  test('422 without a reason', async () => {
    const sale = await newSale();
    const payment = await payFor(sale, 10000);
    const res = await auth(request(app).post(`/api/admin/payments/${payment.id}/void`)).send({});
    expect(res.status).toBe(422);
  });

  test('404 for an unknown payment and 400 for a malformed id', async () => {
    const body = { reason: 'x' };
    expect(
      (await auth(request(app).post('/api/admin/payments/650000000000000000000000/void')).send(body)).status
    ).toBe(404);
    expect((await auth(request(app).post('/api/admin/payments/not-an-id/void')).send(body)).status).toBe(400);
  });
});
