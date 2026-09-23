// sahlearn-api/src/utils/scoreQuiz.js
// Pure scoring. Never trusts the shape of `answers` — it arrives from a public,
// unauthenticated endpoint.
function scoreQuiz(questions, answers) {
  const submitted = new Map();
  if (Array.isArray(answers)) {
    for (const a of answers) {
      const qi = a?.questionIndex;
      if (!Number.isInteger(qi) || qi < 0 || qi >= questions.length) continue;
      // First answer for a question wins; a duplicate cannot score twice or
      // overwrite an earlier one.
      if (submitted.has(qi)) continue;
      submitted.set(qi, Number.isInteger(a?.selectedIndex) ? a.selectedIndex : null);
    }
  }

  let score = 0;
  let maxScore = 0;

  const results = questions.map((q, questionIndex) => {
    const points = q.points || 1;
    maxScore += points;

    const selectedIndex = submitted.has(questionIndex) ? submitted.get(questionIndex) : null;
    const inRange =
      Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < q.options.length;
    const isCorrect = inRange && selectedIndex === q.correctIndex;
    if (isCorrect) score += points;

    return {
      questionIndex,
      selectedIndex: inRange ? selectedIndex : null,
      correctIndex: q.correctIndex,
      isCorrect,
      points,
    };
  });

  return { score, maxScore, results };
}

module.exports = { scoreQuiz };
