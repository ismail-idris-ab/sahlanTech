const { lagosDateKey } = require('../../src/utils/dateKey');

describe('lagosDateKey', () => {
  test('returns YYYY-MM-DD', () => {
    expect(lagosDateKey(new Date('2026-09-22T09:00:00Z'))).toBe('2026-09-22');
  });

  test('00:30 UTC is already the next day in Lagos', () => {
    // Lagos is UTC+1 year-round, so 2026-09-22T00:30Z is 01:30 on the 22nd.
    expect(lagosDateKey(new Date('2026-09-22T00:30:00Z'))).toBe('2026-09-22');
  });

  test('23:30 UTC is already the next day in Lagos', () => {
    // 2026-09-21T23:30Z is 00:30 on the 22nd in Lagos. This is the case
    // toISOString().slice(0,10) gets wrong.
    expect(lagosDateKey(new Date('2026-09-21T23:30:00Z'))).toBe('2026-09-22');
  });

  test('defaults to now and is a valid key', () => {
    expect(lagosDateKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
