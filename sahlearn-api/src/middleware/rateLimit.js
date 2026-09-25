const rateLimit = require('express-rate-limit');

const makeRateLimiter = (max, windowMinutes, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message },
    // Tests share one process and would trip the limiter on unrelated requests.
    // A test that specifically asserts 429 sets TEST_RATE_LIMIT=1.
    skip: () => process.env.NODE_ENV === 'test' && process.env.TEST_RATE_LIMIT !== '1',
  });

const globalLimiter = makeRateLimiter(1000, 15, 'Too many requests. Please slow down.');
const loginLimiter = makeRateLimiter(30, 15, 'Too many login attempts. Try again in 15 minutes.');
const contactLimiter = makeRateLimiter(5, 60, 'Too many contact submissions. Try again later.');
const enrollmentLimiter = makeRateLimiter(3, 60, 'Too many enrollment submissions. Try again later.');
const checkinLimiter = makeRateLimiter(5, 60, 'Too many check-in attempts. Try again later.');
const quizReadLimiter = makeRateLimiter(60, 15, 'Too many requests. Please slow down.');
// 60, not 10: the quiz is open to everyone now, and a school lab, cybercafe or
// any network behind shared mobile NAT is a single IP. A refresh mid-quiz also
// re-posts to /start, because the attempt token is held in memory only, so the
// count climbs faster than the number of people.
const quizStartLimiter = makeRateLimiter(60, 60, 'Too many quiz attempts from this network. Try again later.');
const quizSubmitLimiter = makeRateLimiter(20, 60, 'Too many submissions. Try again later.');
// Tighter than the other public quiz routes: this one takes a phone number as
// input, so it is the one an attacker would grind to probe numbers.
const receiptReadLimiter = makeRateLimiter(60, 15, 'Too many requests. Please slow down.');
const receiptPdfLimiter = makeRateLimiter(20, 15, 'Too many downloads. Try again shortly.');
const quizLookupLimiter = makeRateLimiter(10, 60, 'Too many lookups. Try again later.');

module.exports = {
  globalLimiter,
  loginLimiter,
  contactLimiter,
  enrollmentLimiter,
  checkinLimiter,
  quizReadLimiter,
  quizStartLimiter,
  quizSubmitLimiter,
  quizLookupLimiter,
  receiptReadLimiter,
  receiptPdfLimiter,
};
