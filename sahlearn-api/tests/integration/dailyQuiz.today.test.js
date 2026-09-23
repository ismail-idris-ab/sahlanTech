const request = require('supertest');
const app = require('../../src/app');
const { createQuiz } = require('../factories');
const { lagosDateKey } = require('../../src/utils/dateKey');

describe('GET /api/daily-quiz/today', () => {
  test('reports unavailable when no quiz exists', async () => {
    const res = await request(app).get('/api/daily-quiz/today');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.available).toBe(false);
  });

  test('reports unavailable when today\'s quiz is unpublished', async () => {
    await createQuiz({ isPublished: false });
    const res = await request(app).get('/api/daily-quiz/today');
    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(false);
  });

  test('reports unavailable when the only published quiz is for another day', async () => {
    await createQuiz({ date: '2020-01-01' });
    const res = await request(app).get('/api/daily-quiz/today');
    expect(res.body.data.available).toBe(false);
  });

  test('returns metadata for today\'s published quiz', async () => {
    const quiz = await createQuiz({ title: 'Monday Mix', description: 'Warm up.' });
    const res = await request(app).get('/api/daily-quiz/today');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      available: true,
      date: lagosDateKey(),
      title: 'Monday Mix',
      description: 'Warm up.',
      questionCount: 5,
      totalPoints: quiz.totalPoints,
    });
  });

  test('never leaks questions or correct answers', async () => {
    await createQuiz();
    const res = await request(app).get('/api/daily-quiz/today');
    expect(res.body.data.questions).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('correctIndex');
  });
});
