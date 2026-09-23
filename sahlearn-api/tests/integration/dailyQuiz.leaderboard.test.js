const request = require('supertest');
const app = require('../../src/app');
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const { createQuiz, createStudent } = require('../factories');
const { lagosDateKey } = require('../../src/utils/dateKey');

const submitted = async (quiz, fullName, score, durationMs) => {
  const student = await createStudent({ fullName });
  return DailyQuizAttempt.create({
    quiz: quiz._id,
    quizDate: quiz.date,
    student: student._id,
    startedAt: new Date(Date.now() - durationMs),
    submittedAt: new Date(),
    durationMs,
    score,
    maxScore: quiz.totalPoints,
    status: 'submitted',
  });
};

describe('GET /api/daily-quiz/leaderboard', () => {
  test('returns an empty board when nobody has played', async () => {
    await createQuiz();
    const res = await request(app).get('/api/daily-quiz/leaderboard');
    expect(res.status).toBe(200);
    expect(res.body.data.entries).toEqual([]);
    expect(res.body.data.date).toBe(lagosDateKey());
  });

  test('ranks by score, then by the faster time', async () => {
    const quiz = await createQuiz();
    await submitted(quiz, 'Slow High', 5, 300000);
    await submitted(quiz, 'Fast High', 5, 60000);
    await submitted(quiz, 'Fast Low', 3, 10000);

    const res = await request(app).get('/api/daily-quiz/leaderboard');
    expect(res.body.data.entries.map((e) => e.fullName)).toEqual(['Fast High', 'Slow High', 'Fast Low']);
    expect(res.body.data.entries.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  test('excludes in-progress attempts', async () => {
    const quiz = await createQuiz();
    const student = await createStudent({ fullName: 'Still Going' });
    await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
    });
    const res = await request(app).get('/api/daily-quiz/leaderboard');
    expect(res.body.data.entries).toEqual([]);
  });

  test('excludes attempts whose quiz is no longer published', async () => {
    const quiz = await createQuiz({ isPublished: false });
    await submitted(quiz, 'Hidden', 5, 1000);
    const res = await request(app).get('/api/daily-quiz/leaderboard');
    expect(res.body.data.entries).toEqual([]);
  });

  test('honours an explicit date', async () => {
    const past = await createQuiz({ date: '2026-09-20' });
    await submitted(past, 'Yesterday Hero', 5, 1000);
    const res = await request(app).get('/api/daily-quiz/leaderboard?date=2026-09-20');
    expect(res.body.data.date).toBe('2026-09-20');
    expect(res.body.data.entries[0].fullName).toBe('Yesterday Hero');
  });

  test('a malformed date returns an empty board, not a 500', async () => {
    await createQuiz();
    for (const bad of ['banana', '2026-13-45', '', '../../etc/passwd', '2026-9-1']) {
      const res = await request(app).get(`/api/daily-quiz/leaderboard?date=${encodeURIComponent(bad)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.entries).toEqual([]);
    }
  });

  test('a future date returns an empty board', async () => {
    await createQuiz();
    const res = await request(app).get('/api/daily-quiz/leaderboard?date=2099-01-01');
    expect(res.status).toBe(200);
    expect(res.body.data.entries).toEqual([]);
  });

  test('never exposes email or student ID', async () => {
    const quiz = await createQuiz();
    const attempt = await submitted(quiz, 'Visible Name', 5, 1000);
    const res = await request(app).get('/api/daily-quiz/leaderboard');
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('@example.com');
    expect(body).not.toContain('SAH/');
    expect(res.body.data.entries[0]).toEqual({
      rank: 1,
      fullName: 'Visible Name',
      score: 5,
      maxScore: quiz.totalPoints,
      durationMs: 1000,
    });
    expect(attempt).toBeDefined();
  });

  test('caps the board at 20 entries', async () => {
    const quiz = await createQuiz();
    for (let i = 0; i < 22; i += 1) {
      await submitted(quiz, `Player ${i}`, 5, 1000 + i);
    }
    const res = await request(app).get('/api/daily-quiz/leaderboard');
    expect(res.body.data.entries).toHaveLength(20);
  });
});
