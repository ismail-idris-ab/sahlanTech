const { currentStreak } = require('../../src/utils/streak');

describe('currentStreak', () => {
  test('is zero with no history', () => {
    expect(currentStreak([], '2026-09-22')).toBe(0);
  });

  test('counts consecutive days ending today', () => {
    expect(currentStreak(['2026-09-22', '2026-09-21', '2026-09-20'], '2026-09-22')).toBe(3);
  });

  test('counts a run ending yesterday, since today is not over', () => {
    expect(currentStreak(['2026-09-21', '2026-09-20'], '2026-09-22')).toBe(2);
  });

  test('is zero when the last play was two days ago', () => {
    expect(currentStreak(['2026-09-20', '2026-09-19'], '2026-09-22')).toBe(0);
  });

  test('stops at the first gap', () => {
    expect(currentStreak(['2026-09-22', '2026-09-21', '2026-09-19'], '2026-09-22')).toBe(2);
  });

  test('is unaffected by input order or duplicates', () => {
    expect(currentStreak(['2026-09-21', '2026-09-22', '2026-09-22'], '2026-09-22')).toBe(2);
  });

  test('crosses a month boundary', () => {
    expect(currentStreak(['2026-10-01', '2026-09-30'], '2026-10-01')).toBe(2);
  });
});
