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
