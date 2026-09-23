// sahlearn-api/src/utils/scoreQuiz.js
// Pure scoring. Never trusts the shape of `answers` — it arrives from a public,
// unauthenticated endpoint.
//
// mcq questions are settled here. essay questions are not scorable by machine:
// they are recorded with awardedPoints null and graded false, and the admin
// marks them later. `score` is therefore "points awarded so far", while
// `maxScore` always counts every question including the unmarked ones.
const ESSAY_MAX_LENGTH = 2000;

function scoreQuiz(questions, answers) {
  const submitted = new Map();
  if (Array.isArray(answers)) {
    for (const a of answers) {
      const qi = a?.questionIndex;
      if (!Number.isInteger(qi) || qi < 0 || qi >= questions.length) continue;
      // First answer for a question wins; a duplicate cannot score twice or
      // overwrite an earlier one.
      if (submitted.has(qi)) continue;
      submitted.set(qi, a);
    }
  }

  let score = 0;
  let maxScore = 0;
  let pendingEssays = 0;

  const results = questions.map((q, questionIndex) => {
    const points = q.points || 1;
    maxScore += points;

    const given = submitted.get(questionIndex);

    if (q.type === 'essay') {
      const raw = typeof given?.text === 'string' ? given.text.trim() : '';
      // Truncated rather than rejected: the student is mid-submit on a public
      // page and losing the whole attempt over a long answer would be worse
      // than losing its tail. The route validator rejects oversized bodies
      // before this point in normal use.
      const text = raw.slice(0, ESSAY_MAX_LENGTH);
      pendingEssays += 1;
      return {
        questionIndex,
        type: 'essay',
        text,
        awardedPoints: null,
        graded: false,
        points,
      };
    }

    const rawSelected = given?.selectedIndex;
    const selectedIndex = Number.isInteger(rawSelected) ? rawSelected : null;
    const inRange =
      Number.isInteger(selectedIndex) && selectedIndex >= 0 && selectedIndex < q.options.length;
    const isCorrect = inRange && selectedIndex === q.correctIndex;
    const awardedPoints = isCorrect ? points : 0;
    score += awardedPoints;

    return {
      questionIndex,
      type: 'mcq',
      selectedIndex: inRange ? selectedIndex : null,
      correctIndex: q.correctIndex,
      isCorrect,
      awardedPoints,
      graded: true,
      points,
    };
  });

  return { score, maxScore, pendingEssays, results };
}

// Recomputes an attempt's score from its own answers. Used after the admin
// marks an essay, so the total is always the sum of what is actually recorded
// rather than an increment that could drift.
function totalAwarded(answers) {
  return (answers || []).reduce(
    (sum, a) => sum + (a.graded && Number.isFinite(a.awardedPoints) ? a.awardedPoints : 0),
    0
  );
}

function countPendingEssays(answers) {
  return (answers || []).filter((a) => !a.graded).length;
}

module.exports = { scoreQuiz, totalAwarded, countPendingEssays, ESSAY_MAX_LENGTH };
