const request = require('supertest');
const app = require('../../src/app');
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const { createQuiz, createStudent, startBody, uniquePhone } = require('../factories');

const start = (body) => request(app).post('/api/daily-quiz/start').send(body);
// A guest: name and phone, no student ID.
const startGuest = (overrides = {}) => start(startBody(overrides));

describe('POST /api/daily-quiz/start', () => {
  describe('validation', () => {
    test('422 when the name is missing', async () => {
      await createQuiz();
      const res = await start({ phone: uniquePhone() });
      expect(res.status).toBe(422);
      expect(res.body.errors[0].field).toBe('fullName');
    });

    test('422 when the phone is missing', async () => {
      await createQuiz();
      const res = await start({ fullName: 'No Phone' });
      expect(res.status).toBe(422);
      expect(res.body.errors[0].field).toBe('phone');
    });

    test('422, not 500, when the name or phone is an array', async () => {
      await createQuiz();
      for (const body of [
        { fullName: ['a'], phone: uniquePhone() },
        { fullName: 'Fine', phone: ['0801'] },
      ]) {
        const res = await start(body);
        expect(res.status).toBe(422);
      }
    });

    test('422 for a phone number that is not a Nigerian mobile', async () => {
      await createQuiz();
      for (const phone of ['0601234567', '12345', '+15551234567']) {
        const res = await start({ fullName: 'Wrong Number', phone });
        expect(res.status).toBe(422);
        expect(res.body.errors[0].field).toBe('phone');
      }
    });
  });

  describe('identity', () => {
    test('a guest with no student ID can take the quiz', async () => {
      await createQuiz();
      const res = await startGuest({ fullName: 'Passing Stranger' });

      expect(res.status).toBe(201);
      const attempt = await DailyQuizAttempt.findOne({ 'participant.fullName': 'Passing Stranger' });
      expect(attempt.student).toBeNull();
      expect(attempt.participant.phoneKey).toMatch(/^234/);
    });

    test('a valid student ID links the attempt to that account', async () => {
      await createQuiz();
      const student = await createStudent();
      const res = await startGuest({ student });

      expect(res.status).toBe(201);
      const attempt = await DailyQuizAttempt.findOne({ student: student._id });
      expect(String(attempt.student)).toBe(String(student._id));
    });

    test('404 for a wrong student ID rather than silently taking it as a guest', async () => {
      await createQuiz();
      const res = await start({ fullName: 'Typo Sufferer', phone: uniquePhone(), studentId: 'SAH/nope' });

      expect(res.status).toBe(404);
      expect(await DailyQuizAttempt.countDocuments()).toBe(0);
    });

    test('404 for an inactive student, worded the same as an unknown ID', async () => {
      await createQuiz();
      const inactive = await createStudent({ isActive: false });
      const unknownRes = await start({ fullName: 'Unknown One', phone: uniquePhone(), studentId: 'SAH/nope' });
      const inactiveRes = await start({
        fullName: 'Inactive One',
        phone: uniquePhone(),
        studentId: inactive.studentId,
      });

      expect(inactiveRes.status).toBe(404);
      // Identical wording, so the endpoint cannot be used to confirm an ID exists.
      expect(inactiveRes.body.message).toBe(unknownRes.body.message);
    });

    test('an empty student ID is treated as a guest, not as a wrong ID', async () => {
      await createQuiz();
      const res = await start({ fullName: 'Blank Id', phone: uniquePhone(), studentId: '' });
      expect(res.status).toBe(201);
    });

    test('the same number typed three ways is one person', async () => {
      await createQuiz();
      const first = await start({ fullName: 'Same Person', phone: '08012345678' });
      const second = await start({ fullName: 'Same Person', phone: '+2348012345678' });
      const third = await start({ fullName: 'Same Person', phone: '0801 234 5678' });

      expect(first.status).toBe(201);
      expect(second.status).toBe(200); // resumed, not a new attempt
      expect(third.status).toBe(200);
      expect(await DailyQuizAttempt.countDocuments()).toBe(1);
    });

    test('two different guests on the same day both get an attempt', async () => {
      await createQuiz();
      const a = await startGuest({ fullName: 'Guest One' });
      const b = await startGuest({ fullName: 'Guest Two' });

      expect(a.status).toBe(201);
      expect(b.status).toBe(201);
      expect(await DailyQuizAttempt.countDocuments()).toBe(2);
    });

    test('adding a student ID the second time does not buy a second attempt', async () => {
      await createQuiz();
      const student = await createStudent();
      const phone = uniquePhone();

      const first = await start({ fullName: 'Sneaky', phone });
      const second = await start({ fullName: 'Sneaky', phone, studentId: student.studentId });

      expect(first.status).toBe(201);
      expect(second.status).toBe(200);
      expect(await DailyQuizAttempt.countDocuments()).toBe(1);
    });
  });

  describe('the quiz itself', () => {
    test('404 when no quiz is published today', async () => {
      const res = await startGuest();
      expect(res.status).toBe(404);
    });

    test('creates an attempt and returns questions without correctIndex', async () => {
      const quiz = await createQuiz();
      const res = await startGuest({ fullName: 'Quiz Taker' });

      expect(res.status).toBe(201);
      expect(res.body.data.attemptToken).toEqual(expect.any(String));
      expect(res.body.data.questions).toHaveLength(5);
      expect(res.body.data.questions[0]).toEqual({
        id: expect.any(String),
        type: 'mcq',
        text: 'Question 1',
        options: ['A', 'B', 'C', 'D'],
        points: 1,
      });
      expect(JSON.stringify(res.body)).not.toContain('correctIndex');

      const attempt = await DailyQuizAttempt.findOne({ 'participant.fullName': 'Quiz Taker' });
      expect(attempt.status).toBe('in_progress');
      expect(attempt.quizDate).toBe(quiz.date);
      expect(attempt.maxScore).toBe(quiz.totalPoints);
      expect(attempt.startedAt).toBeInstanceOf(Date);
      expect(attempt.verified).toBe(false);
    });

    test('the response never carries the phone number back', async () => {
      await createQuiz();
      const phone = uniquePhone();
      const res = await start({ fullName: 'Private', phone });
      expect(JSON.stringify(res.body)).not.toContain(phone);
    });

    test('stores a hashed IP, never the raw one', async () => {
      await createQuiz();
      await startGuest({ fullName: 'Hashed' });
      const attempt = await DailyQuizAttempt.findOne({ 'participant.fullName': 'Hashed' }).lean();
      expect(attempt.ipHash).toEqual(expect.any(String));
      expect(attempt.ipHash).not.toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(attempt.ipHash).not.toContain('::');
    });

    test('a second start resumes the same attempt and does not reset startedAt', async () => {
      await createQuiz();
      const phone = uniquePhone();
      const first = await start({ fullName: 'Resumer', phone });
      const second = await start({ fullName: 'Resumer', phone });

      expect(second.status).toBe(200);
      expect(second.body.data.startedAt).toBe(first.body.data.startedAt);
      expect(await DailyQuizAttempt.countDocuments()).toBe(1);
    });

    test('409 with the existing result once they have submitted today', async () => {
      const quiz = await createQuiz();
      const phone = uniquePhone();
      await start({ fullName: 'Done Already', phone });

      const attempt = await DailyQuizAttempt.findOne({ quizDate: quiz.date });
      attempt.set({
        startedAt: new Date(Date.now() - 60000),
        submittedAt: new Date(),
        durationMs: 60000,
        score: 4,
        maxScore: 5,
        status: 'submitted',
      });
      await attempt.save();

      const res = await start({ fullName: 'Done Already', phone });
      expect(res.status).toBe(409);
      expect(res.body.data).toMatchObject({ score: 4, maxScore: 5, durationMs: 60000 });
    });
  });
});
