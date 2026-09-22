const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const { createQuiz, createStudent } = require('../factories');

describe('DailyQuizAttempt model', () => {
  test('defaults to in_progress and unverified', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    const attempt = await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
      maxScore: quiz.totalPoints,
    });
    expect(attempt.status).toBe('in_progress');
    expect(attempt.verified).toBe(false);
    expect(attempt.score).toBe(0);
  });

  test('allows only one attempt per student per date', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    const base = { quiz: quiz._id, quizDate: quiz.date, student: student._id, startedAt: new Date() };
    await DailyQuizAttempt.create(base);
    await DailyQuizAttempt.init();
    await expect(DailyQuizAttempt.create(base)).rejects.toThrow();
  });

  test('allows the same student on a different date', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await DailyQuizAttempt.init();
    await DailyQuizAttempt.create({ quiz: quiz._id, quizDate: '2026-09-21', student: student._id, startedAt: new Date() });
    await expect(
      DailyQuizAttempt.create({ quiz: quiz._id, quizDate: '2026-09-22', student: student._id, startedAt: new Date() })
    ).resolves.toBeDefined();
  });

  test('never exposes ipHash in JSON', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    const attempt = await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
      ipHash: 'deadbeef',
    });
    const json = attempt.toJSON();
    expect(json.ipHash).toBeUndefined();
    expect(json.id).toBeDefined();
    expect(json._id).toBeUndefined();
  });
});
