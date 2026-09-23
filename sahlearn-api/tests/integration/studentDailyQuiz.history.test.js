const request = require('supertest');
const app = require('../../src/app');
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const { createQuiz, createStudent, createStudentToken } = require('../factories');
const { lagosDateKey } = require('../../src/utils/dateKey');

const attemptFor = (quiz, student, overrides = {}) =>
  DailyQuizAttempt.create({
    quiz: quiz._id,
    quizDate: quiz.date,
    student: student._id,
    startedAt: new Date(Date.now() - 60000),
    submittedAt: new Date(),
    durationMs: 60000,
    score: 4,
    maxScore: 5,
    status: 'submitted',
    ...overrides,
  });

describe('GET /api/student/daily-quiz/history', () => {
  test('401 without a student token', async () => {
    const res = await request(app).get('/api/student/daily-quiz/history');
    expect(res.status).toBe(401);
  });

  test('returns an empty history with zeroed stats', async () => {
    const student = await createStudent();
    const res = await request(app)
      .get('/api/student/daily-quiz/history')
      .set('Authorization', `Bearer ${createStudentToken(student)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta).toMatchObject({ page: 1, total: 0, totalPages: 0 });
    expect(res.body.stats).toEqual({ totalTaken: 0, averageScore: 0, bestScore: 0, currentStreak: 0 });
  });

  test('returns only the caller\'s submitted attempts, newest first', async () => {
    const quiz = await createQuiz();
    const other = await createQuiz({ date: '2026-09-20' });
    const me = await createStudent();
    const someoneElse = await createStudent();

    await attemptFor(quiz, me, { score: 5 });
    await attemptFor(other, me, { quizDate: '2026-09-20', score: 2 });
    await attemptFor(quiz, someoneElse, { score: 1 });

    const res = await request(app)
      .get('/api/student/daily-quiz/history')
      .set('Authorization', `Bearer ${createStudentToken(me)}`);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].date).toBe(lagosDateKey());
    expect(res.body.data[0]).toMatchObject({ score: 5, maxScore: 5, durationMs: 60000, title: quiz.title });
  });

  test('excludes in-progress attempts from history and stats', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
    });

    const res = await request(app)
      .get('/api/student/daily-quiz/history')
      .set('Authorization', `Bearer ${createStudentToken(student)}`);

    expect(res.body.data).toEqual([]);
    expect(res.body.stats.totalTaken).toBe(0);
  });

  test('computes stats across every attempt, not just the current page', async () => {
    const student = await createStudent();
    const scores = [5, 3, 1];
    for (let i = 0; i < scores.length; i += 1) {
      const date = `2026-09-${String(20 + i).padStart(2, '0')}`;
      const quiz = await createQuiz({ date });
      await attemptFor(quiz, student, { quizDate: date, score: scores[i] });
    }

    const res = await request(app)
      .get('/api/student/daily-quiz/history?limit=1')
      .set('Authorization', `Bearer ${createStudentToken(student)}`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 1, total: 3, totalPages: 3 });
    expect(res.body.stats).toMatchObject({ totalTaken: 3, bestScore: 5, averageScore: 3 });
  });

  test('never exposes correct answers', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await attemptFor(quiz, student);
    const res = await request(app)
      .get('/api/student/daily-quiz/history')
      .set('Authorization', `Bearer ${createStudentToken(student)}`);
    expect(JSON.stringify(res.body)).not.toContain('correctIndex');
  });
});
