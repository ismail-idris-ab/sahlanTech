const request = require('supertest');
const app = require('../../src/app');
const { createAdminToken, createStudent, createStudentToken, saleBody } = require('../factories');

let adminToken;
beforeEach(async () => {
  adminToken = await createAdminToken();
});
const asAdmin = (req) => req.set('Authorization', `Bearer ${adminToken}`);
const asStudent = (student) =>
  request(app).get('/api/student/receipts').set('Authorization', `Bearer ${createStudentToken(student)}`);

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
    expect((await request(app).get('/api/student/receipts')).status).toBe(401);
  });

  test("returns only the calling student's receipts", async () => {
    const mine = await createStudent();
    const theirs = await createStudent();
    await sellTo(mine);
    await sellTo(theirs);

    const res = await asStudent(mine);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ amount: 20000, balance: 30000 });
  });

  test('summarises what they have paid and what is outstanding', async () => {
    const student = await createStudent();
    await sellTo(student, { amount: 20000, unitPrice: 50000 });
    await sellTo(student, { amount: 5000, unitPrice: 5000 });

    const res = await asStudent(student);
    expect(res.body.summary).toMatchObject({ totalPaid: 25000, outstanding: 30000 });
  });

  test('voided sales are excluded from both the list and the summary', async () => {
    const student = await createStudent();
    const sale = await sellTo(student);
    await asAdmin(request(app).post(`/api/admin/sales/${sale.id}/void`)).send({ reason: 'cancelled' });

    const res = await asStudent(student);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.summary).toMatchObject({ totalPaid: 0, outstanding: 0 });
  });

  test('a student with no sales gets an empty list, not an error', async () => {
    const res = await asStudent(await createStudent());
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.summary).toMatchObject({ totalPaid: 0, outstanding: 0 });
  });
});
