const request = require('supertest');
const app = require('../../src/app');
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const { createQuiz, createStudent, createAdminToken, uniquePhone } = require('../factories');

const start = (body) => request(app).post('/api/daily-quiz/start').send(body);
const myScores = (phone) => request(app).post('/api/daily-quiz/my-scores').send({ phone });

// Takes the whole quiz through the public endpoints, as a guest unless a
// student is given. The factory quiz has correctIndex = i % 4.
const takeQuiz = async ({ fullName, phone, student, correct = 5 }) => {
  const started = await start({
    fullName,
    phone,
    ...(student ? { studentId: student.studentId } : {}),
  });
  const answers = Array.from({ length: 5 }, (_, i) => ({
    questionIndex: i,
    selectedIndex: i < correct ? i % 4 : (i % 4) + 1,
  }));
  return request(app)
    .post('/api/daily-quiz/submit')
    .send({ attemptToken: started.body.data.attemptToken, answers });
};

describe('open access — anyone can take the quiz', () => {
  describe('a guest with no account', () => {
    test('can take the quiz end to end and get a score', async () => {
      await createQuiz();
      const res = await takeQuiz({ fullName: 'Street Genius', phone: uniquePhone(), correct: 5 });

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(5);

      const attempt = await DailyQuizAttempt.findOne({ 'participant.fullName': 'Street Genius' });
      expect(attempt.student).toBeNull();
      expect(attempt.status).toBe('submitted');
    });

    test('appears on the leaderboard beside registered students', async () => {
      await createQuiz();
      const student = await createStudent({ fullName: 'Registered Rita' });
      await takeQuiz({ fullName: 'Registered Rita', phone: uniquePhone(), student, correct: 5 });
      await takeQuiz({ fullName: 'Guest Garba', phone: uniquePhone(), correct: 3 });

      const res = await request(app).get('/api/daily-quiz/leaderboard');
      const names = res.body.data.entries.map((e) => e.fullName);
      expect(names).toEqual(['Registered Rita', 'Guest Garba']);
      expect(res.body.data.entries[0].isStudent).toBe(true);
      expect(res.body.data.entries[1].isStudent).toBe(false);
    });
  });

  describe('what the leaderboard shows', () => {
    test('masks the phone number rather than publishing it', async () => {
      await createQuiz();
      await takeQuiz({ fullName: 'Masked Person', phone: '08012345678' });

      const res = await request(app).get('/api/daily-quiz/leaderboard');
      const entry = res.body.data.entries[0];

      expect(entry.maskedPhone).toBe('0801***5678');
      const body = JSON.stringify(res.body);
      expect(body).not.toContain('08012345678');
      expect(body).not.toContain('2348012345678');
    });

    test('still never exposes an email or a student ID', async () => {
      await createQuiz();
      const student = await createStudent();
      await takeQuiz({ fullName: 'Rita', phone: uniquePhone(), student });

      const body = JSON.stringify((await request(app).get('/api/daily-quiz/leaderboard')).body);
      expect(body).not.toContain('@example.com');
      expect(body).not.toContain('SAH/');
    });
  });

  describe('POST /api/daily-quiz/my-scores', () => {
    test('returns that number\'s own past results', async () => {
      await createQuiz();
      const phone = uniquePhone();
      await takeQuiz({ fullName: 'History Haver', phone, correct: 4 });

      const res = await myScores(phone);
      expect(res.status).toBe(200);
      expect(res.body.data.entries).toHaveLength(1);
      expect(res.body.data.entries[0]).toMatchObject({ score: 4, maxScore: 5 });
    });

    test('accepts the number in any of the three formats', async () => {
      await createQuiz();
      await takeQuiz({ fullName: 'Format Free', phone: '08012345678' });

      for (const typed of ['08012345678', '+2348012345678', '0801 234 5678']) {
        const res = await myScores(typed);
        expect(res.body.data.entries).toHaveLength(1);
      }
    });

    test('an unknown number looks exactly like a known one with no attempts', async () => {
      await createQuiz();
      const knownButUnused = uniquePhone();
      await start({ fullName: 'Started Only', phone: knownButUnused }); // in progress, never submitted

      const unknown = await myScores(uniquePhone());
      const known = await myScores(knownButUnused);

      // Same status and same body: this cannot be used to test which numbers
      // are in the database.
      expect(unknown.status).toBe(known.status);
      expect(unknown.body).toEqual(known.body);
      expect(unknown.body.data.entries).toEqual([]);
    });

    test('never returns the name attached to the number', async () => {
      await createQuiz();
      const phone = uniquePhone();
      await takeQuiz({ fullName: 'Secret Identity', phone });

      const res = await myScores(phone);
      expect(JSON.stringify(res.body)).not.toContain('Secret Identity');
    });

    test('422 for a number that is not a Nigerian mobile', async () => {
      const res = await myScores('12345');
      expect(res.status).toBe(422);
      expect(res.body.errors[0].field).toBe('phone');
    });

    test('422, not 500, when the phone is an array', async () => {
      const res = await request(app).post('/api/daily-quiz/my-scores').send({ phone: ['0801'] });
      expect(res.status).toBe(422);
    });

    test('only returns submitted attempts', async () => {
      await createQuiz();
      const phone = uniquePhone();
      await start({ fullName: 'Half Done', phone }); // started, not submitted

      const res = await myScores(phone);
      expect(res.body.data.entries).toEqual([]);
    });
  });

  describe('one attempt per phone per day', () => {
    test('two guests on one day both succeed — the guest index is partial', async () => {
      await createQuiz();
      // This is the case a plain unique index on { quizDate, student } breaks:
      // both rows have student null, so the second looks like a duplicate.
      await takeQuiz({ fullName: 'Guest A', phone: uniquePhone() });
      const second = await takeQuiz({ fullName: 'Guest B', phone: uniquePhone() });

      expect(second.status).toBe(200);
      expect(await DailyQuizAttempt.countDocuments()).toBe(2);
    });

    test('the database itself refuses a duplicate phone on the same day', async () => {
      const quiz = await createQuiz();
      const phone = uniquePhone();
      await start({ fullName: 'First Go', phone });

      const attempt = await DailyQuizAttempt.findOne({ quizDate: quiz.date }).lean();
      await expect(
        DailyQuizAttempt.create({
          quiz: quiz._id,
          quizDate: quiz.date,
          participant: attempt.participant,
          startedAt: new Date(),
          maxScore: 5,
        })
      ).rejects.toThrow(/duplicate key/i);
    });

    test('the same phone can take a different day', async () => {
      const today = await createQuiz();
      const phone = uniquePhone();
      await start({ fullName: 'Daily Regular', phone });

      const attempt = await DailyQuizAttempt.findOne({ quizDate: today.date }).lean();
      const yesterday = await DailyQuizAttempt.create({
        quiz: today._id,
        quizDate: '2026-09-22',
        participant: attempt.participant,
        startedAt: new Date(),
        maxScore: 5,
      });

      expect(yesterday._id).toBeDefined();
    });
  });

  describe('the admin view', () => {
    test('shows the phone number and whether they are registered', async () => {
      const quiz = await createQuiz();
      const token = await createAdminToken();
      const student = await createStudent();
      await takeQuiz({ fullName: 'Rita', phone: '08012345678', student });
      await takeQuiz({ fullName: 'Garba', phone: '08087654321' });

      const res = await request(app)
        .get(`/api/admin/daily-quizzes/${quiz._id}/results`)
        .set('Authorization', `Bearer ${token}`);

      const rita = res.body.data.find((r) => r.fullName === 'Rita');
      const garba = res.body.data.find((r) => r.fullName === 'Garba');

      // Full number here, unlike the public board — this is who to contact.
      expect(rita.phone).toBe('08012345678');
      expect(rita.isStudent).toBe(true);
      expect(garba.isStudent).toBe(false);
      expect(garba.studentId).toBe('—');
    });
  });
});
