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
    expect(computeTotals(items, null)).toEqual({ subtotal: 190000, discountAmount: 0, total: 190000 });
  });

  test('applies a fixed discount', () => {
    expect(computeTotals(items, { type: 'amount', value: 10000 })).toEqual({
      subtotal: 190000,
      discountAmount: 10000,
      total: 180000,
    });
  });

  test('applies a percentage discount and rounds to whole naira', () => {
    expect(computeTotals(items, { type: 'percent', value: 10 })).toEqual({
      subtotal: 190000,
      discountAmount: 19000,
      total: 171000,
    });
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
    for (const n of [subtotal, discountAmount, total]) expect(Number.isInteger(n)).toBe(true);
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
