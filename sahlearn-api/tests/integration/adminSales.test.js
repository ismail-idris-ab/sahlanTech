const request = require('supertest');
const app = require('../../src/app');
const Sale = require('../../src/models/Sale');
const Payment = require('../../src/models/Payment');
const { createAdminToken, createStudent, saleBody } = require('../factories');

let token;
beforeEach(async () => {
  token = await createAdminToken();
});
const auth = (req) => req.set('Authorization', `Bearer ${token}`);
const post = (body) => auth(request(app).post('/api/admin/sales')).send(body);
const newSale = async (overrides) => (await post(saleBody(overrides))).body.data;
const pay = (sale, body) => auth(request(app).post(`/api/admin/sales/${sale.id}/payments`)).send(body);

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
    expect((await post(saleBody({ items: [] }))).status).toBe(422);
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
    const sale = await newSale();
    const res = await auth(request(app).get(`/api/admin/sales/${sale.id}`));
    expect(res.status).toBe(200);
    expect(res.body.data.payments).toEqual([]);
  });

  test('400 for a malformed id and 404 for an unknown one', async () => {
    expect((await auth(request(app).get('/api/admin/sales/not-an-id'))).status).toBe(400);
    expect((await auth(request(app).get('/api/admin/sales/650000000000000000000000'))).status).toBe(404);
  });
});

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

  test('409 when changing items or the discount after a payment exists', async () => {
    const sale = await newSale();
    await pay(sale, { amount: 10000, method: 'cash' });

    const items = await auth(request(app).patch(`/api/admin/sales/${sale.id}`)).send({
      items: [{ description: 'Course', quantity: 2, unitPrice: 50000 }],
    });
    expect(items.status).toBe(409);
    expect(items.body.message).toMatch(/cannot be changed/i);

    const discount = await auth(request(app).patch(`/api/admin/sales/${sale.id}`)).send({
      discount: { type: 'percent', value: 50 },
    });
    expect(discount.status).toBe(409);
  });

  test('name and notes stay editable after a payment', async () => {
    const sale = await newSale();
    await pay(sale, { amount: 10000, method: 'cash' });
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
    await pay(sale, { amount: 10000, method: 'cash' });

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
    expect((await auth(request(app).post(`/api/admin/sales/${sale.id}/void`)).send({})).status).toBe(422);
  });

  test('409 when voiding twice', async () => {
    const sale = await newSale();
    await auth(request(app).post(`/api/admin/sales/${sale.id}/void`)).send({ reason: 'first' });
    const res = await auth(request(app).post(`/api/admin/sales/${sale.id}/void`)).send({ reason: 'again' });
    expect(res.status).toBe(409);
  });
});
