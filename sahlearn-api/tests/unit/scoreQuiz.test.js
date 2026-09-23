const { scoreQuiz } = require('../../src/utils/scoreQuiz');

const questions = [
  { text: 'Q1', options: ['a', 'b'], correctIndex: 0, points: 1 },
  { text: 'Q2', options: ['a', 'b'], correctIndex: 1, points: 2 },
  { text: 'Q3', options: ['a', 'b'], correctIndex: 0, points: 1 },
];

describe('scoreQuiz', () => {
  test('awards the question points for each correct answer', () => {
    const { score, maxScore } = scoreQuiz(questions, [
      { questionIndex: 0, selectedIndex: 0 },
      { questionIndex: 1, selectedIndex: 1 },
      { questionIndex: 2, selectedIndex: 1 },
    ]);
    expect(score).toBe(3);
    expect(maxScore).toBe(4);
  });

  test('scores zero for an empty answer list and still reports every question', () => {
    const { score, results } = scoreQuiz(questions, []);
    expect(score).toBe(0);
    expect(results).toHaveLength(3);
    expect(results[0]).toMatchObject({ questionIndex: 0, selectedIndex: null, isCorrect: false });
  });

  test('ignores an out-of-range questionIndex', () => {
    const { score, results } = scoreQuiz(questions, [{ questionIndex: 99, selectedIndex: 0 }]);
    expect(score).toBe(0);
    expect(results).toHaveLength(3);
  });

  test('ignores a negative questionIndex', () => {
    expect(scoreQuiz(questions, [{ questionIndex: -1, selectedIndex: 0 }]).score).toBe(0);
  });

  test('a duplicate questionIndex is only counted once', () => {
    const { score } = scoreQuiz(questions, [
      { questionIndex: 1, selectedIndex: 1 },
      { questionIndex: 1, selectedIndex: 1 },
    ]);
    expect(score).toBe(2); // not 4
  });

  test('a later duplicate does not overwrite an earlier answer', () => {
    const { score } = scoreQuiz(questions, [
      { questionIndex: 0, selectedIndex: 0 }, // correct
      { questionIndex: 0, selectedIndex: 1 }, // must be ignored
    ]);
    expect(score).toBe(1);
  });

  test('a non-integer or out-of-range selectedIndex scores zero without throwing', () => {
    const { score } = scoreQuiz(questions, [
      { questionIndex: 0, selectedIndex: 'zero' },
      { questionIndex: 1, selectedIndex: 9 },
      { questionIndex: 2, selectedIndex: null },
    ]);
    expect(score).toBe(0);
  });

  test('tolerates answers being undefined', () => {
    expect(scoreQuiz(questions, undefined).score).toBe(0);
  });
});
