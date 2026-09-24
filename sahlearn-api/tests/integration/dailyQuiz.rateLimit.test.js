// This file opts into real rate limiting. It must set the flag and require the
// app *after*, because the limiters capture the flag when app.js is loaded.
process.env.TEST_RATE_LIMIT = '1';

const request = require('supertest');
const app = require('../../src/app');
const { createQuiz, startBody, uniquePhone } = require('../factories');

afterAll(() => {
  delete process.env.TEST_RATE_LIMIT;
});

describe('daily quiz rate limits', () => {
  // The limit is 60 an hour per IP, raised from 10 once the quiz opened to
  // everyone: a school lab or cybercafe is a single IP, and a mid-quiz refresh
  // re-posts to /start, so the count climbs faster than the number of people.
  const START_LIMIT = 60;

  test(`start number ${START_LIMIT + 1} in an hour is refused with 429`, async () => {
    await createQuiz();
    let last;
    for (let i = 0; i < START_LIMIT + 1; i += 1) {
      last = await request(app).post('/api/daily-quiz/start').send(startBody({ fullName: 'Rate Limited', phone: uniquePhone(), studentId: 'SAH/does-not-exist' }));
    }
    expect(last.status).toBe(429);
    expect(last.body.status).toBe('error');
    expect(last.body.message).toMatch(/too many/i);
  });
});
