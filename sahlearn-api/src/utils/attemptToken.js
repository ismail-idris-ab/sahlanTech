// sahlearn-api/src/utils/attemptToken.js
// The daily quiz identifies a student by their ID alone, so the raw ID is
// exchanged once for a short-lived token bound to a single attempt. Everything
// after /start authenticates with the token.
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ATTEMPT_TOKEN_TTL = '3h';

const signAttemptToken = (attemptId) =>
  jwt.sign({ attemptId: String(attemptId), kind: 'daily-quiz-attempt' }, process.env.JWT_SECRET, {
    expiresIn: ATTEMPT_TOKEN_TTL,
  });

const verifyAttemptToken = (token) => {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Reject any other token type signed with the same secret — a student or
    // admin login token must not work here.
    if (payload.kind !== 'daily-quiz-attempt') return null;
    return { attemptId: payload.attemptId };
  } catch {
    return null;
  }
};

// Salted with JWT_SECRET so no new environment variable is needed and the raw
// IP is never stored.
const hashIp = (ip) =>
  crypto.createHash('sha256').update(`${ip || 'unknown'}${process.env.JWT_SECRET}`).digest('hex');

module.exports = { signAttemptToken, verifyAttemptToken, hashIp, ATTEMPT_TOKEN_TTL };
