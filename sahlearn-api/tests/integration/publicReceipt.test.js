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
      await auth(request(app).post(`/api/admin/sales/${sale.id}/payments`)).send({
        amount: 30000,
        method: 'cash',
      })
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
    expect((await request(app).get(`/api/receipts/${payment.publicToken}`)).status).toBe(200);
  });
});

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
    expect((await request(app).get(`/api/admin/payments/${payment.id}/pdf`)).status).toBe(401);
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
