const DailyQuiz = require('../../src/models/DailyQuiz');

const makeQuestions = (n = 5) =>
  Array.from({ length: n }, (_, i) => ({
    text: `Question ${i + 1}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: 0,
    points: 1,
  }));

describe('DailyQuiz model', () => {
  test('computes totalPoints from question points on save', async () => {
    const questions = makeQuestions(5);
    questions[0].points = 3;
    const quiz = await DailyQuiz.create({ date: '2026-09-22', title: 'Day 1', questions });
    expect(quiz.totalPoints).toBe(7); // 3 + 1 + 1 + 1 + 1
  });

  test('accepts a single-question quiz', async () => {
    const quiz = await DailyQuiz.create({ date: '2026-09-22', title: 'One only', questions: makeQuestions(1) });
    expect(quiz.questions).toHaveLength(1);
    expect(quiz.totalPoints).toBe(1);
  });

  test('rejects a quiz with no questions', async () => {
    await expect(
      DailyQuiz.create({ date: '2026-09-22', title: 'Empty', questions: [] })
    ).rejects.toThrow(/between 1 and 10/);
  });

  test('rejects more than 10 questions', async () => {
    await expect(
      DailyQuiz.create({ date: '2026-09-22', title: 'Too long', questions: makeQuestions(11) })
    ).rejects.toThrow(/between 1 and 10/);
  });

  test('rejects a question with fewer than 2 options', async () => {
    const questions = makeQuestions(5);
    questions[2].options = ['Only one'];
    await expect(
      DailyQuiz.create({ date: '2026-09-22', title: 'Bad options', questions })
    ).rejects.toThrow(/2 and 4 options/);
  });

  test('rejects a correctIndex outside the options range', async () => {
    const questions = makeQuestions(5);
    questions[1].correctIndex = 4; // only 0..3 exist
    await expect(
      DailyQuiz.create({ date: '2026-09-22', title: 'Bad index', questions })
    ).rejects.toThrow(/correctIndex/);
  });

  test('enforces one quiz per date', async () => {
    await DailyQuiz.create({ date: '2026-09-22', title: 'First', questions: makeQuestions() });
    await DailyQuiz.init(); // ensure the unique index is built before asserting
    await expect(
      DailyQuiz.create({ date: '2026-09-22', title: 'Second', questions: makeQuestions() })
    ).rejects.toThrow();
  });

  test('toJSON exposes id and hides __v', async () => {
    const quiz = await DailyQuiz.create({ date: '2026-09-22', title: 'Day 1', questions: makeQuestions() });
    const json = quiz.toJSON();
    expect(json.id).toBeDefined();
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
  });

  test('defaults isPublished to false', async () => {
    const quiz = await DailyQuiz.create({ date: '2026-09-22', title: 'Day 1', questions: makeQuestions() });
    expect(quiz.isPublished).toBe(false);
  });
});
