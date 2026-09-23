const request = require('supertest');
const app = require('../../src/app');
const DailyQuiz = require('../../src/models/DailyQuiz');
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const {
  createMixedQuiz,
  createStudent,
  createAdminToken,
  makeQuestions,
  makeEssayQuestions,
  startBody,
} = require('../factories');

let token;
beforeEach(async () => {
  token = await createAdminToken();
});
const auth = (req) => req.set('Authorization', `Bearer ${token}`);

// mcq questions come from makeQuestions, whose correctIndex is i % 4.
const takeQuiz = async (student, answers) => {
  const start = await request(app).post('/api/daily-quiz/start').send(startBody({ student }));
  return request(app)
    .post('/api/daily-quiz/submit')
    .send({ attemptToken: start.body.data.attemptToken, answers });
};

describe('essay questions', () => {
  describe('authoring', () => {
    test('admin can create a quiz mixing mcq and essay questions', async () => {
      const res = await auth(request(app).post('/api/admin/daily-quizzes')).send({
        title: 'Mixed',
        questions: [...makeQuestions(2), ...makeEssayQuestions(1, 5)],
      });
      expect(res.status).toBe(201);
      expect(res.body.data.questions[2]).toMatchObject({ type: 'essay', points: 5 });
      // mcq points (1 + 1) + essay points (5)
      expect(res.body.data.totalPoints).toBe(7);
    });

    test('an essay question is stored without options or a correct answer', async () => {
      const res = await auth(request(app).post('/api/admin/daily-quizzes')).send({
        title: 'Essay only',
        questions: makeEssayQuestions(1, 3),
      });
      expect(res.status).toBe(201);
      expect(res.body.data.questions[0].options).toEqual([]);
      expect(res.body.data.questions[0].correctIndex ?? null).toBeNull();
    });

    test('422 when an essay question carries a correct answer', async () => {
      const res = await auth(request(app).post('/api/admin/daily-quizzes')).send({
        title: 'Confused',
        questions: [{ type: 'essay', text: 'Discuss', points: 2, correctIndex: 0 }],
      });
      expect(res.status).toBe(422);
    });

    test('422 for an unknown question type', async () => {
      const res = await auth(request(app).post('/api/admin/daily-quizzes')).send({
        title: 'Bad type',
        questions: [{ type: 'drawing', text: 'Draw it', points: 1 }],
      });
      expect(res.status).toBe(422);
    });

    test('mcq questions are still held to the option rules', async () => {
      const res = await auth(request(app).post('/api/admin/daily-quizzes')).send({
        title: 'Bad mcq',
        questions: [{ type: 'mcq', text: 'Pick', options: ['A', 'B'], correctIndex: 3 }],
      });
      expect(res.status).toBe(422);
    });
  });

  describe('taking a quiz with essays', () => {
    test('the public question list carries the type and no options for essays', async () => {
      await createMixedQuiz({ mcq: 2, essay: 1 });
      const student = await createStudent();
      const res = await request(app).post('/api/daily-quiz/start').send(startBody({ student }));

      expect(res.status).toBe(201);
      expect(res.body.data.questions[2]).toMatchObject({ type: 'essay', options: [] });
      expect(JSON.stringify(res.body)).not.toContain('correctIndex');
    });

    test('today reports how many questions are essays', async () => {
      await createMixedQuiz({ mcq: 2, essay: 1 });
      const res = await request(app).get('/api/daily-quiz/today');
      expect(res.body.data).toMatchObject({ questionCount: 3, essayCount: 1, totalPoints: 7 });
    });

    test('submitting scores the mcq part now and leaves the essay pending', async () => {
      await createMixedQuiz({ mcq: 2, essay: 1, essayPoints: 5 });
      const student = await createStudent();

      const res = await takeQuiz(student, [
        { questionIndex: 0, selectedIndex: 0 }, // correct
        { questionIndex: 1, selectedIndex: 1 }, // correct
        { questionIndex: 2, text: '  My written answer.  ' },
      ]);

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(2); // essay's 5 points not awarded yet
      expect(res.body.data.maxScore).toBe(7); // but they do count toward the total
      expect(res.body.data.pendingEssays).toBe(1);

      const essayResult = res.body.data.results[2];
      expect(essayResult).toMatchObject({ type: 'essay', graded: false, awardedPoints: null });
      expect(essayResult.text).toBe('My written answer.'); // trimmed

      const attempt = await DailyQuizAttempt.findOne({ student: student._id });
      expect(attempt.score).toBe(2);
      expect(attempt.pendingEssays).toBe(1);
      expect(attempt.answers[2].text).toBe('My written answer.');
      expect(attempt.answers[2].graded).toBe(false);
    });

    test('a skipped essay is still recorded as pending', async () => {
      await createMixedQuiz({ mcq: 1, essay: 1 });
      const student = await createStudent();
      const res = await takeQuiz(student, [{ questionIndex: 0, selectedIndex: 0 }]);

      expect(res.body.data.pendingEssays).toBe(1);
      expect(res.body.data.results[1]).toMatchObject({ type: 'essay', text: '', graded: false });
    });

    test('422 for an essay answer over 2000 characters', async () => {
      await createMixedQuiz({ mcq: 1, essay: 1 });
      const student = await createStudent();
      const res = await takeQuiz(student, [{ questionIndex: 1, text: 'x'.repeat(2001) }]);
      expect(res.status).toBe(422);
    });

    test('an mcq-only quiz still reports nothing pending', async () => {
      await createMixedQuiz({ mcq: 2, essay: 0 });
      const student = await createStudent();
      const res = await takeQuiz(student, [{ questionIndex: 0, selectedIndex: 0 }]);
      expect(res.body.data.pendingEssays).toBe(0);
    });
  });

  describe('grading', () => {
    const setup = async ({ essayPoints = 5 } = {}) => {
      const quiz = await createMixedQuiz({ mcq: 2, essay: 1, essayPoints });
      const student = await createStudent();
      await takeQuiz(student, [
        { questionIndex: 0, selectedIndex: 0 }, // correct
        { questionIndex: 1, selectedIndex: 3 }, // wrong
        { questionIndex: 2, text: 'An answer worth marking.' },
      ]);
      const attempt = await DailyQuizAttempt.findOne({ student: student._id });
      return { quiz, student, attempt };
    };

    const grade = (quiz, attempt, grades) =>
      auth(request(app).patch(`/api/admin/daily-quizzes/${quiz._id}/attempts/${attempt._id}/grades`)).send({ grades });

    test('401 without an admin token', async () => {
      const { quiz, attempt } = await setup();
      const res = await request(app)
        .patch(`/api/admin/daily-quizzes/${quiz._id}/attempts/${attempt._id}/grades`)
        .send({ grades: [{ questionIndex: 2, awardedPoints: 3 }] });
      expect(res.status).toBe(401);
    });

    test('the attempt detail shows the written answer and the mcq key', async () => {
      const { quiz, attempt } = await setup();
      const res = await auth(request(app).get(`/api/admin/daily-quizzes/${quiz._id}/attempts/${attempt._id}`));

      expect(res.status).toBe(200);
      expect(res.body.data.pendingEssays).toBe(1);
      expect(res.body.data.questions[2]).toMatchObject({
        type: 'essay',
        answerText: 'An answer worth marking.',
        graded: false,
        awardedPoints: null,
        points: 5,
      });
      // Admin-only endpoint, so the answer key IS present here.
      expect(res.body.data.questions[0].correctIndex).toBe(0);
    });

    test('marking an essay raises the score and clears the pending count', async () => {
      const { quiz, attempt } = await setup({ essayPoints: 5 });
      const res = await grade(quiz, attempt, [{ questionIndex: 2, awardedPoints: 4 }]);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ score: 5, pendingEssays: 0 }); // 1 mcq + 4 essay

      const updated = await DailyQuizAttempt.findById(attempt._id);
      expect(updated.score).toBe(5);
      expect(updated.pendingEssays).toBe(0);
      expect(updated.answers[2]).toMatchObject({ awardedPoints: 4, graded: true });
    });

    test('a mark of zero counts as graded, not as still pending', async () => {
      const { quiz, attempt } = await setup();
      const res = await grade(quiz, attempt, [{ questionIndex: 2, awardedPoints: 0 }]);
      expect(res.body.data).toMatchObject({ score: 1, pendingEssays: 0 });
    });

    test('re-marking replaces the previous mark rather than adding to it', async () => {
      const { quiz, attempt } = await setup({ essayPoints: 5 });
      await grade(quiz, attempt, [{ questionIndex: 2, awardedPoints: 5 }]);
      const res = await grade(quiz, attempt, [{ questionIndex: 2, awardedPoints: 2 }]);
      expect(res.body.data.score).toBe(3); // 1 mcq + 2 essay, not 1 + 5 + 2
    });

    test('422 for a mark above the question points, with nothing written', async () => {
      const { quiz, attempt } = await setup({ essayPoints: 5 });
      const res = await grade(quiz, attempt, [{ questionIndex: 2, awardedPoints: 6 }]);

      expect(res.status).toBe(422);
      const unchanged = await DailyQuizAttempt.findById(attempt._id);
      expect(unchanged.pendingEssays).toBe(1);
      expect(unchanged.score).toBe(1);
    });

    test('422 for a negative mark', async () => {
      const { quiz, attempt } = await setup();
      const res = await grade(quiz, attempt, [{ questionIndex: 2, awardedPoints: -1 }]);
      expect(res.status).toBe(422);
    });

    test('422 when trying to hand-mark an mcq question', async () => {
      const { quiz, attempt } = await setup();
      const res = await grade(quiz, attempt, [{ questionIndex: 0, awardedPoints: 1 }]);
      expect(res.status).toBe(422);
    });

    test('422 for a question index outside the quiz', async () => {
      const { quiz, attempt } = await setup();
      const res = await grade(quiz, attempt, [{ questionIndex: 99, awardedPoints: 1 }]);
      expect(res.status).toBe(422);
    });

    test('one bad mark in a batch blocks the good ones too', async () => {
      const quiz = await createMixedQuiz({ mcq: 1, essay: 2, essayPoints: 3 });
      const student = await createStudent();
      await takeQuiz(student, [
        { questionIndex: 1, text: 'First answer' },
        { questionIndex: 2, text: 'Second answer' },
      ]);
      const attempt = await DailyQuizAttempt.findOne({ student: student._id });

      const res = await grade(quiz, attempt, [
        { questionIndex: 1, awardedPoints: 3 }, // fine
        { questionIndex: 2, awardedPoints: 9 }, // over the limit
      ]);

      expect(res.status).toBe(422);
      const unchanged = await DailyQuizAttempt.findById(attempt._id);
      expect(unchanged.pendingEssays).toBe(2);
      expect(unchanged.score).toBe(0);
    });

    test('404 for an attempt belonging to a different quiz', async () => {
      const { attempt } = await setup();
      const other = await DailyQuiz.create({
        date: '2026-01-01',
        title: 'Other day',
        questions: makeEssayQuestions(1, 2),
      });
      const res = await grade(other, attempt, [{ questionIndex: 0, awardedPoints: 1 }]);
      expect(res.status).toBe(404);
    });

    test('400 for a malformed attempt id', async () => {
      const { quiz } = await setup();
      const res = await auth(
        request(app).patch(`/api/admin/daily-quizzes/${quiz._id}/attempts/not-an-id/grades`)
      ).send({ grades: [{ questionIndex: 2, awardedPoints: 1 }] });
      expect(res.status).toBe(400);
    });

    test('the leaderboard reflects the new score and drops the pending flag', async () => {
      const { quiz, attempt } = await setup({ essayPoints: 5 });

      const before = await request(app).get('/api/daily-quiz/leaderboard');
      expect(before.body.data.entries[0]).toMatchObject({ score: 1, pending: true });

      await grade(quiz, attempt, [{ questionIndex: 2, awardedPoints: 5 }]);

      const after = await request(app).get('/api/daily-quiz/leaderboard');
      expect(after.body.data.entries[0]).toMatchObject({ score: 6, pending: false });
    });

    test('the results list flags who still needs marking', async () => {
      const { quiz, attempt } = await setup();
      const before = await auth(request(app).get(`/api/admin/daily-quizzes/${quiz._id}/results`));
      expect(before.body.data[0].pendingEssays).toBe(1);

      await grade(quiz, attempt, [{ questionIndex: 2, awardedPoints: 1 }]);
      const after = await auth(request(app).get(`/api/admin/daily-quizzes/${quiz._id}/results`));
      expect(after.body.data[0].pendingEssays).toBe(0);
    });
  });
});
