// sahlearn-api/src/utils/streak.js
const DAY_MS = 24 * 60 * 60 * 1000;

const shift = (key, days) =>
  new Date(new Date(`${key}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);

// Counts back from today, or from yesterday when today has not been played —
// a student mid-morning has not broken their streak yet.
function currentStreak(dateKeys, today) {
  const played = new Set(dateKeys);
  if (played.size === 0) return 0;

  let cursor = played.has(today) ? today : shift(today, -1);
  if (!played.has(cursor)) return 0;

  let streak = 0;
  while (played.has(cursor)) {
    streak += 1;
    cursor = shift(cursor, -1);
  }
  return streak;
}

module.exports = { currentStreak };
