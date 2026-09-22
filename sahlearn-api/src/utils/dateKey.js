// All daily-quiz day boundaries are Africa/Lagos, not UTC. 'en-CA' formats as
// YYYY-MM-DD, which sorts lexicographically and matches the stored key format.
const LAGOS_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function lagosDateKey(d = new Date()) {
  return LAGOS_FORMATTER.format(d);
}

module.exports = { lagosDateKey };
