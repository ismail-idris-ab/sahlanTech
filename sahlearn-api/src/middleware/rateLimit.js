const rateLimit = require('express-rate-limit');

const makeRateLimiter = (max, windowMinutes, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { status: 'error', message },
  });

const globalLimiter = makeRateLimiter(100, 15, 'Too many requests. Please slow down.');
const loginLimiter = makeRateLimiter(10, 15, 'Too many login attempts. Try again in 15 minutes.');
const contactLimiter = makeRateLimiter(5, 60, 'Too many contact submissions. Try again later.');
const enrollmentLimiter = makeRateLimiter(3, 60, 'Too many enrollment submissions. Try again later.');
const checkinLimiter = makeRateLimiter(5, 60, 'Too many check-in attempts. Try again later.');

module.exports = { globalLimiter, loginLimiter, contactLimiter, enrollmentLimiter, checkinLimiter };
