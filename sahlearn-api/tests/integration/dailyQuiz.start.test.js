const request = require('supertest');
const app = require('../../src/app');
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const { createQuiz, createStudent } = require('../factories');

const start = (studentId) => request(app).post('/api/daily-quiz/start').send({ studentId });

describe('POST /api/daily-quiz/start', () => {
  test('422 when studentId is missing', async () => {
    await createQuiz();
    const res = await request(app).post('/api/daily-quiz/start').send({});
    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('studentId');
  });

  test('404 for an unknown student ID', async () => {
    await createQuiz();
    const res = await start('SAH/nope');
    expect(res.status).toBe(404);
  });

  test('404 for an inactive student, with the same message as unknown', async () => {
    await createQuiz();
    const inactive = await createStudent({ isActive: false });
    const unknownRes = await start('SAH/nope');
    const inactiveRes = await start(inactive.studentId);
    expect(inactiveRes.status).toBe(404);
    // Identical wording, so the endpoint cannot be used to confirm an ID exists.
    expect(inactiveRes.body.message).toBe(unknownRes.body.message);
  });

  test('404 when no quiz is published today', async () => {
    const student = await createStudent();
    const res = await start(student.studentId);
    expect(res.status).toBe(404);
  });

  test('creates an attempt and returns questions without correctIndex', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    const res = await start(student.studentId);

    expect(res.status).toBe(201);
    expect(res.body.data.attemptToken).toEqual(expect.any(String));
    expect(res.body.data.questions).toHaveLength(5);
    expect(res.body.data.questions[0]).toEqual({
      id: expect.any(String),
      text: 'Question 1',
      options: ['A', 'B', 'C', 'D'],
      points: 1,
    });
    expect(JSON.stringify(res.body)).not.toContain('correctIndex');

    const attempt = await DailyQuizAttempt.findOne({ student: student._id });
    expect(attempt.status).toBe('in_progress');
    expect(attempt.quizDate).toBe(quiz.date);
    expect(attempt.maxScore).toBe(quiz.totalPoints);
    expect(attempt.startedAt).toBeInstanceOf(Date);
    expect(attempt.verified).toBe(false);
  });

  test('stores a hashed IP, never the raw one', async () => {
    await createQuiz();
    const student = await createStudent();
    await start(student.studentId);
    const attempt = await DailyQuizAttempt.findOne({ student: student._id }).lean();
    expect(attempt.ipHash).toEqual(expect.any(String));
    expect(attempt.ipHash).not.toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    expect(attempt.ipHash).not.toContain('::');
  });

  test('a second start resumes the same attempt and does not reset startedAt', async () => {
    await createQuiz();
    const student = await createStudent();
    const first = await start(student.studentId);
    const second = await start(student.studentId);

    expect(second.status).toBe(200);
    expect(second.body.data.startedAt).toBe(first.body.data.startedAt);
    expect(await DailyQuizAttempt.countDocuments({ student: student._id })).toBe(1);
  });

  test('409 with the existing result once the student has submitted today', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(Date.now() - 60000),
      submittedAt: new Date(),
      durationMs: 60000,
      score: 4,
      maxScore: 5,
      status: 'submitted',
    });

    const res = await start(student.studentId);
    expect(res.status).toBe(409);
    expect(res.body.data).toMatchObject({ score: 4, maxScore: 5, durationMs: 60000 });
  });
});
