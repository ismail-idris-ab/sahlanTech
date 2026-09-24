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
  test('the 11th start in an hour is refused with 429', async () => {
    await createQuiz();
    let last;
    for (let i = 0; i < 11; i += 1) {
      last = await request(app).post('/api/daily-quiz/start').send(startBody({ fullName: 'Rate Limited', phone: uniquePhone(), studentId: 'SAH/does-not-exist' }));
    }
    expect(last.status).toBe(429);
    expect(last.body.status).toBe('error');
    expect(last.body.message).toMatch(/too many/i);
  });
});
