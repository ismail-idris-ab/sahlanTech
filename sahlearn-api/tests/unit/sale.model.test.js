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
    await Sale.deleteMany({});
    const b = await basePayment({ receiptNo: 'SAH/R/2026/0002' });
    expect(a.publicToken).not.toBe(b.publicToken);
  });

  test('refuses a duplicate receiptNo', async () => {
    await basePayment();
    await Sale.deleteMany({});
    await expect(basePayment()).rejects.toThrow(/duplicate key/i);
  });

  test('refuses an amount below one naira', async () => {
    await expect(basePayment({ amount: 0 })).rejects.toThrow();
  });

  test('only known payment methods are accepted', async () => {
    await expect(basePayment({ method: 'crypto' })).rejects.toThrow();
  });
});
