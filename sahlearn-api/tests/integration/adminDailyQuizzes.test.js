const request = require('supertest');
const app = require('../../src/app');
const DailyQuiz = require('../../src/models/DailyQuiz');
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const { createQuiz, createStudent, createAdminToken, createStudentToken, makeQuestions } = require('../factories');
const { lagosDateKey } = require('../../src/utils/dateKey');

let token;
beforeEach(async () => {
  token = await createAdminToken();
});

const auth = (req) => req.set('Authorization', `Bearer ${token}`);

describe('admin daily quizzes', () => {
  test('401 without a token', async () => {
    const res = await request(app).get('/api/admin/daily-quizzes');
    expect(res.status).toBe(401);
  });

  test('403 for a student token', async () => {
    const student = await createStudent();
    const res = await request(app)
      .get('/api/admin/daily-quizzes')
      .set('Authorization', `Bearer ${createStudentToken(student)}`);
    expect([401, 403]).toContain(res.status);
  });

  test('creates a quiz dated today by default', async () => {
    const res = await auth(request(app).post('/api/admin/daily-quizzes')).send({
      title: 'Fresh quiz',
      questions: makeQuestions(),
    });
    expect(res.status).toBe(201);
    expect(res.body.data.date).toBe(lagosDateKey());
    expect(res.body.data.isPublished).toBe(false);
    expect(res.body.data.totalPoints).toBe(5);
  });

  test('422 for fewer than 5 questions', async () => {
    const res = await auth(request(app).post('/api/admin/daily-quizzes')).send({
      title: 'Too short',
      questions: makeQuestions(3),
    });
    expect(res.status).toBe(422);
  });

  test('409 for a duplicate date', async () => {
    await createQuiz({ date: '2026-09-22' });
    const res = await auth(request(app).post('/api/admin/daily-quizzes')).send({
      date: '2026-09-22',
      title: 'Second',
      questions: makeQuestions(),
    });
    expect(res.status).toBe(409);
  });

  test('lists quizzes newest date first with attempt counts', async () => {
    const older = await createQuiz({ date: '2026-09-20' });
    await createQuiz({ date: '2026-09-21' });
    const student = await createStudent();
    await DailyQuizAttempt.create({
      quiz: older._id,
      quizDate: older.date,
      student: student._id,
      startedAt: new Date(),
      submittedAt: new Date(),
      durationMs: 1000,
      status: 'submitted',
    });

    const res = await auth(request(app).get('/api/admin/daily-quizzes'));
    expect(res.body.data.map((q) => q.date)).toEqual(['2026-09-21', '2026-09-20']);
    expect(res.body.data[1].attemptCount).toBe(1);
    expect(res.body.meta.total).toBe(2);
  });

  test('a single quiz includes correctIndex for the admin', async () => {
    const quiz = await createQuiz();
    const res = await auth(request(app).get(`/api/admin/daily-quizzes/${quiz.id}`));
    expect(res.status).toBe(200);
    expect(res.body.data.questions[0].correctIndex).toBe(0);
  });

  test('404 for an unknown id', async () => {
    const res = await auth(request(app).get('/api/admin/daily-quizzes/650000000000000000000000'));
    expect(res.status).toBe(404);
  });

  test('400 for a malformed id instead of a 500', async () => {
    const res = await auth(request(app).get('/api/admin/daily-quizzes/not-an-id'));
    expect(res.status).toBe(400);
  });

  test('publishing sets publishedAt', async () => {
    const quiz = await createQuiz({ isPublished: false, publishedAt: null });
    const res = await auth(request(app).patch(`/api/admin/daily-quizzes/${quiz.id}`)).send({ isPublished: true });
    expect(res.status).toBe(200);
    expect(res.body.data.isPublished).toBe(true);
    expect(res.body.data.publishedAt).toBeTruthy();
  });

  test('questions stay editable while nobody has submitted', async () => {
    const quiz = await createQuiz();
    const questions = makeQuestions(6);
    const res = await auth(request(app).patch(`/api/admin/daily-quizzes/${quiz.id}`)).send({ questions });
    expect(res.status).toBe(200);
    expect(res.body.data.questions).toHaveLength(6);
  });

  test('409 when editing questions after a submitted attempt exists', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
      submittedAt: new Date(),
      durationMs: 1000,
      status: 'submitted',
    });

    const res = await auth(request(app).patch(`/api/admin/daily-quizzes/${quiz.id}`)).send({
      questions: makeQuestions(6),
    });
    expect(res.status).toBe(409);
  });

  test('title stays editable after a submitted attempt exists', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
      submittedAt: new Date(),
      durationMs: 1000,
      status: 'submitted',
    });

    const res = await auth(request(app).patch(`/api/admin/daily-quizzes/${quiz.id}`)).send({ title: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Renamed');
  });

  test('deleting a quiz removes its attempts', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
    });

    const res = await auth(request(app).delete(`/api/admin/daily-quizzes/${quiz.id}`));
    expect(res.status).toBe(200);
    expect(await DailyQuiz.countDocuments()).toBe(0);
    expect(await DailyQuizAttempt.countDocuments()).toBe(0);
  });

  test('results list submitted attempts with student details, ranked', async () => {
    const quiz = await createQuiz();
    const fast = await createStudent({ fullName: 'Fast One' });
    const slow = await createStudent({ fullName: 'Slow One' });
    const base = { quiz: quiz._id, quizDate: quiz.date, status: 'submitted', submittedAt: new Date(), maxScore: 5 };
    await DailyQuizAttempt.create({ ...base, student: slow._id, startedAt: new Date(), score: 5, durationMs: 90000 });
    await DailyQuizAttempt.create({ ...base, student: fast._id, startedAt: new Date(), score: 5, durationMs: 30000 });

    const res = await auth(request(app).get(`/api/admin/daily-quizzes/${quiz.id}/results`));
    expect(res.status).toBe(200);
    expect(res.body.data.map((r) => r.fullName)).toEqual(['Fast One', 'Slow One']);
    expect(res.body.data[0]).toMatchObject({ score: 5, maxScore: 5, durationMs: 30000 });
    expect(res.body.data[0].studentId).toEqual(expect.any(String));
    expect(res.body.meta.total).toBe(2);
  });
});
