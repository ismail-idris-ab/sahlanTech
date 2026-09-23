const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const DailyQuiz = require('../../src/models/DailyQuiz');
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const Student = require('../../src/models/Student');
const { createQuiz, createStudent, createStudentToken } = require('../factories');
const { signAttemptToken } = require('../../src/utils/attemptToken');

// The factory sets correctIndex = i % 4, so all-correct answers are i % 4.
const correctAnswers = (n = 5) =>
  Array.from({ length: n }, (_, i) => ({ questionIndex: i, selectedIndex: i % 4 }));

const startFor = async (student) => {
  const res = await request(app).post('/api/daily-quiz/start').send({ studentId: student.studentId });
  return res.body.data.attemptToken;
};

const submit = (attemptToken, answers) =>
  request(app).post('/api/daily-quiz/submit').send({ attemptToken, answers });

describe('POST /api/daily-quiz/submit', () => {
  test('401 for a missing or malformed token', async () => {
    const res = await submit('not-a-token', []);
    expect(res.status).toBe(401);
  });

  test('401 for a student login token — wrong token kind', async () => {
    const student = await createStudent();
    const res = await submit(createStudentToken(student), []);
    expect(res.status).toBe(401);
  });

  test('401 for an expired attempt token', async () => {
    const expired = jwt.sign(
      { attemptId: '650000000000000000000000', kind: 'daily-quiz-attempt' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const res = await submit(expired, []);
    expect(res.status).toBe(401);
  });

  test('404 when the attempt no longer exists', async () => {
    const res = await submit(signAttemptToken('650000000000000000000000'), []);
    expect(res.status).toBe(404);
  });

  test('scores correctly and records a server-computed duration', async () => {
    await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);

    // Pretend the attempt started two minutes ago.
    await DailyQuizAttempt.updateOne(
      { student: student._id },
      { startedAt: new Date(Date.now() - 120000) }
    );

    const res = await submit(token, correctAnswers());
    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(5);
    expect(res.body.data.maxScore).toBe(5);
    expect(res.body.data.durationMs).toBeGreaterThanOrEqual(120000);
    expect(res.body.data.results).toHaveLength(5);
    expect(res.body.data.results[0]).toMatchObject({ isCorrect: true, correctIndex: 0 });
  });

  test('ignores a client-supplied duration', async () => {
    await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);
    await DailyQuizAttempt.updateOne({ student: student._id }, { startedAt: new Date(Date.now() - 90000) });

    const res = await request(app)
      .post('/api/daily-quiz/submit')
      .send({ attemptToken: token, answers: correctAnswers(), durationMs: 1, submittedAt: '1999-01-01' });

    expect(res.body.data.durationMs).toBeGreaterThanOrEqual(90000);
    const attempt = await DailyQuizAttempt.findOne({ student: student._id }).lean();
    expect(attempt.durationMs).toBeGreaterThanOrEqual(90000);
  });

  test('persists the attempt as submitted', async () => {
    await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);
    await submit(token, correctAnswers());

    const attempt = await DailyQuizAttempt.findOne({ student: student._id }).lean();
    expect(attempt.status).toBe('submitted');
    expect(attempt.score).toBe(5);
    expect(attempt.submittedAt).toBeInstanceOf(Date);
  });

  test('409 on a second submit with the same token', async () => {
    await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);
    await submit(token, correctAnswers());
    const second = await submit(token, correctAnswers());
    expect(second.status).toBe(409);
  });

  test('403 when the student was deactivated mid-attempt', async () => {
    await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);
    await Student.updateOne({ _id: student._id }, { isActive: false });

    const res = await submit(token, correctAnswers());
    expect(res.status).toBe(403);
    const attempt = await DailyQuizAttempt.findOne({ student: student._id }).lean();
    expect(attempt.status).toBe('in_progress');
  });

  test('404 when the quiz was deleted mid-attempt', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);
    await DailyQuiz.deleteOne({ _id: quiz._id });

    const res = await submit(token, correctAnswers());
    expect(res.status).toBe(404);
  });

  test('still scores when the quiz was unpublished mid-attempt', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);
    await DailyQuiz.updateOne({ _id: quiz._id }, { isPublished: false });

    const res = await submit(token, correctAnswers());
    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(5);
  });

  test('a token whose attempt belongs to another day scores against that day\'s quiz', async () => {
    // A token lives 3 hours and can cross midnight Lagos. The attempt carries
    // its own quiz reference, so it must never bind to "today".
    const oldQuiz = await createQuiz({ date: '2026-09-21', isPublished: true });
    const student = await createStudent();
    const attempt = await DailyQuizAttempt.create({
      quiz: oldQuiz._id,
      quizDate: '2026-09-21',
      student: student._id,
      startedAt: new Date(Date.now() - 60000),
      maxScore: oldQuiz.totalPoints,
    });
    await createQuiz(); // today's quiz also exists

    const res = await submit(signAttemptToken(attempt._id), correctAnswers());
    expect(res.status).toBe(200);
    const saved = await DailyQuizAttempt.findById(attempt._id).lean();
    expect(saved.quizDate).toBe('2026-09-21');
    expect(String(saved.quiz)).toBe(String(oldQuiz._id));
  });
});
