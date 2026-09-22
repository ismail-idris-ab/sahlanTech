# Daily Public Quiz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public daily quiz page where a student enters their student ID, answers auto-scored MCQs, and has their score and completion time recorded to their dashboard and a public leaderboard, authored daily by the admin.

**Architecture:** Two new Mongoose models (`DailyQuiz`, `DailyQuizAttempt`) sit alongside the existing `Exam` models rather than extending them, because the quiz is publicly reachable and the existing exam queries must not grow a filter they could forget. Access is student-ID-only: `POST /api/daily-quiz/start` exchanges an ID for a short-lived `attemptToken` JWT, and every subsequent call uses that token, so the raw ID crosses the wire once. All timing and scoring happen server-side from the attempt's own `startedAt`.

**Tech Stack:** Node 20+, Express 4, Mongoose 9, jsonwebtoken, express-validator, express-rate-limit (all already in `sahlearn-api`). React 19, React Router 7, axios, Tailwind 3, lucide-react, react-hot-toast, react-helmet-async (all already in `sahlearn-web`). New dev dependencies for the API only: jest, supertest, mongodb-memory-server.

**Spec:** `docs/superpowers/specs/2026-09-22-daily-quiz-design.md`

## Global Constraints

- Response envelopes exactly as CLAUDE.md §10: `{ status: 'success', data }`, lists add `meta: { page, limit, total, totalPages }`, errors `{ status: 'error', message }` plus `errors: [{ field, message }]` for validation.
- Use `src/utils/apiResponse.js` helpers (`success`, `successList`, `notFound`) — do not hand-roll `res.json` for success paths.
- Controllers throw or return; `express-async-errors` is already required in `app.js`, so no `try/catch` that swallows errors.
- Day boundaries are **Africa/Lagos**, never UTC. Always via `lagosDateKey()` from Task 1.
- `correctIndex` must never appear in any public response payload except the `submit` result.
- Questions per quiz: minimum 5, maximum 10. Options per question: minimum 2, maximum 4.
- New API routes mount **before** the generic `/api/student` and `/api/admin` routers in `app.js` (see the comment at `sahlearn-api/src/app.js` around the student mounts).
- Frontend components never call `axios` directly — every call goes through a file in `src/services/`.
- Tailwind only. No new CSS files. Mobile-first. One `<h1>` per page.
- Commit messages use Conventional Commits and end with:
  `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`

## Review Focus

Input classes the spec implies but does not give explicit behavior for. Each has a test assigned to the task that owns the code.

1. **An `attemptToken` presented on a later day, or for a quiz since deleted.** A token is valid for 3 hours and can cross midnight Lagos. Submitting must not write a score onto a different day's quiz or crash on a missing quiz. → Task 6.
2. **An `answers` array that does not match the questions** — more entries than questions, a duplicate `questionIndex`, a `questionIndex` out of range, or a non-integer `selectedIndex`. Scoring must not throw and must not award points twice. → Task 6.
3. **A malformed or absent `date` on the leaderboard query** — `?date=banana`, `?date=2026-13-45`, a future date. Must return an empty leaderboard, not a 500. → Task 7.
4. **A student deactivated between `start` and `submit`.** The ID check happens at start only; submit must re-check and refuse. → Task 6.
5. **A quiz unpublished by the admin while a student is mid-attempt.** Submit must still record the attempt rather than 500, but the attempt must not surface on the public leaderboard. → Task 7.

---

## Task 1: Test harness and the Lagos date key

This is the enabling task. Nothing else can be tested until `npm test` runs.

**Files:**
- Modify: `sahlearn-api/package.json` (scripts + devDependencies)
- Create: `sahlearn-api/jest.config.js`
- Create: `sahlearn-api/tests/setup.js`
- Create: `sahlearn-api/src/utils/dateKey.js`
- Test: `sahlearn-api/tests/unit/dateKey.test.js`
- Modify: `sahlearn-api/src/middleware/rateLimit.js`
- Modify: `sahlearn-api/.gitignore` is already correct — verify `node_modules` is listed, do not change otherwise

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `lagosDateKey(d?: Date) => string` — `'YYYY-MM-DD'` in `Africa/Lagos`.
  - `tests/setup.js` global hooks that start an in-memory MongoDB, connect Mongoose, clear all collections between tests, and tear down.

- [ ] **Step 1: Install the test dependencies**

```bash
cd sahlearn-api
npm install --save-dev jest@^29 supertest@^7 mongodb-memory-server@^10
```

If `mongodb-memory-server` cannot download a MongoDB binary on this machine, stop and report it — do not silently switch to mocking Mongoose. The fallback is to set `MONGODB_URI_TEST` to a real scratch database and have `tests/setup.js` use it, which is described in Step 3.

- [ ] **Step 2: Add the jest config**

Create `sahlearn-api/jest.config.js`:

```js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testTimeout: 30000,
  // Mongoose keeps handles open briefly after disconnect; this keeps CI honest
  // without failing the run.
  forceExit: true,
};
```

- [ ] **Step 3: Add the test setup file**

Create `sahlearn-api/tests/setup.js`:

```js
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

beforeAll(async () => {
  let uri = process.env.MONGODB_URI_TEST;
  if (!uri) {
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }
  await mongoose.connect(uri);
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
});
```

- [ ] **Step 4: Point `npm test` at jest**

In `sahlearn-api/package.json`, replace the `test` script:

```json
"test": "jest --runInBand"
```

`--runInBand` matters: the tests share one database and clear it between tests, so they must not run in parallel.

- [ ] **Step 5: Write the failing test for the date key**

Create `sahlearn-api/tests/unit/dateKey.test.js`:

```js
const { lagosDateKey } = require('../../src/utils/dateKey');

describe('lagosDateKey', () => {
  test('returns YYYY-MM-DD', () => {
    expect(lagosDateKey(new Date('2026-09-22T09:00:00Z'))).toBe('2026-09-22');
  });

  test('00:30 UTC is already the next day in Lagos', () => {
    // Lagos is UTC+1 year-round, so 2026-09-22T00:30Z is 01:30 on the 22nd.
    expect(lagosDateKey(new Date('2026-09-22T00:30:00Z'))).toBe('2026-09-22');
  });

  test('23:30 UTC is already the next day in Lagos', () => {
    // 2026-09-21T23:30Z is 00:30 on the 22nd in Lagos. This is the case
    // toISOString().slice(0,10) gets wrong.
    expect(lagosDateKey(new Date('2026-09-21T23:30:00Z'))).toBe('2026-09-22');
  });

  test('defaults to now and is a valid key', () => {
    expect(lagosDateKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 6: Run it and watch it fail**

Run: `cd sahlearn-api && npx jest tests/unit/dateKey.test.js`
Expected: FAIL — `Cannot find module '../../src/utils/dateKey'`

- [ ] **Step 7: Implement the date key**

Create `sahlearn-api/src/utils/dateKey.js`:

```js
// All daily-quiz day boundaries are Africa/Lagos, not UTC. 'en-CA' formats as
// YYYY-MM-DD, which sorts lexicographically and matches the stored key format.
const LAGOS_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function lagosDateKey(d = new Date()) {
  return LAGOS_FORMATTER.format(d);
}

module.exports = { lagosDateKey };
```

- [ ] **Step 8: Run it and watch it pass**

Run: `cd sahlearn-api && npx jest tests/unit/dateKey.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 9: Let rate limiters stand down during tests**

Every request in every test goes through `globalLimiter`. Without this, a long test file starts returning 429 partway through.

In `sahlearn-api/src/middleware/rateLimit.js`, change `makeRateLimiter`:

```js
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
```

- [ ] **Step 10: Run the whole suite**

Run: `cd sahlearn-api && npm test`
Expected: PASS, 1 suite, 4 tests.

- [ ] **Step 11: Commit**

```bash
git add sahlearn-api/package.json sahlearn-api/package-lock.json sahlearn-api/jest.config.js sahlearn-api/tests sahlearn-api/src/utils/dateKey.js sahlearn-api/src/middleware/rateLimit.js
git commit -m "test(api): add jest harness and Africa/Lagos date key util

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: `DailyQuiz` model

**Files:**
- Create: `sahlearn-api/src/models/DailyQuiz.js`
- Test: `sahlearn-api/tests/unit/dailyQuiz.model.test.js`

**Interfaces:**
- Consumes: `lagosDateKey` from Task 1 (for test fixtures only).
- Produces: `DailyQuiz` model. Document shape:
  `{ id, date: String, title, description, questions: [{ _id, text, options: [String], correctIndex: Number, points: Number }], totalPoints: Number, isPublished: Boolean, publishedAt: Date, createdAt, updatedAt }`.
  `toJSON` maps `_id` → `id` and drops `__v`.

- [ ] **Step 1: Write the failing test**

Create `sahlearn-api/tests/unit/dailyQuiz.model.test.js`:

```js
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

  test('rejects fewer than 5 questions', async () => {
    await expect(
      DailyQuiz.create({ date: '2026-09-22', title: 'Too short', questions: makeQuestions(4) })
    ).rejects.toThrow(/between 5 and 10/);
  });

  test('rejects more than 10 questions', async () => {
    await expect(
      DailyQuiz.create({ date: '2026-09-22', title: 'Too long', questions: makeQuestions(11) })
    ).rejects.toThrow(/between 5 and 10/);
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd sahlearn-api && npx jest tests/unit/dailyQuiz.model.test.js`
Expected: FAIL — `Cannot find module '../../src/models/DailyQuiz'`

- [ ] **Step 3: Implement the model**

Create `sahlearn-api/src/models/DailyQuiz.js`:

```js
// sahlearn-api/src/models/DailyQuiz.js
const mongoose = require('mongoose');

// MCQ only, unlike Exam's questionSchema — the daily quiz must be auto-scorable
// so the score can be written to the student dashboard with no admin grading.
const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    options: {
      type: [String],
      required: true,
      validate: [
        {
          validator: (v) => Array.isArray(v) && v.length >= 2 && v.length <= 4,
          message: 'Each question must have between 2 and 4 options',
        },
        {
          validator: (v) => v.every((o) => typeof o === 'string' && o.trim().length > 0),
          message: 'Options cannot be blank',
        },
      ],
    },
    correctIndex: {
      type: Number,
      required: true,
      validate: {
        validator(v) {
          return Number.isInteger(v) && v >= 0 && v < (this.options?.length || 0);
        },
        message: 'correctIndex must point at one of the options',
      },
    },
    points: { type: Number, default: 1, min: 1 },
  },
  { _id: true }
);

const dailyQuizSchema = new mongoose.Schema(
  {
    date: {
      type: String, // 'YYYY-MM-DD' in Africa/Lagos
      required: true,
      unique: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'],
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (v) => v.length >= 5 && v.length <= 10,
        message: 'A daily quiz must have between 5 and 10 questions',
      },
    },
    totalPoints: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

dailyQuizSchema.pre('validate', function () {
  this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
});

dailyQuizSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('DailyQuiz', dailyQuizSchema);
```

- [ ] **Step 4: Run it and watch it pass**

Run: `cd sahlearn-api && npx jest tests/unit/dailyQuiz.model.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add sahlearn-api/src/models/DailyQuiz.js sahlearn-api/tests/unit/dailyQuiz.model.test.js
git commit -m "feat(api): add DailyQuiz model

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: `DailyQuizAttempt` model and shared test factories

**Files:**
- Create: `sahlearn-api/src/models/DailyQuizAttempt.js`
- Create: `sahlearn-api/tests/factories.js`
- Test: `sahlearn-api/tests/unit/dailyQuizAttempt.model.test.js`

**Interfaces:**
- Consumes: `DailyQuiz` from Task 2, `Student`, `User`.
- Produces:
  - `DailyQuizAttempt` model. Shape: `{ id, quiz, quizDate, student, answers: [{ questionIndex, selectedIndex }], score, maxScore, startedAt, submittedAt, durationMs, status: 'in_progress' | 'submitted', verified, createdAt, updatedAt }`. `ipHash` exists on the document but **never appears in `toJSON`**.
  - `tests/factories.js` exporting:
    - `makeQuestions(n = 5) => Array`
    - `createQuiz(overrides = {}) => Promise<DailyQuiz>` (published, dated today by default)
    - `createStudent(overrides = {}) => Promise<Student>`
    - `createAdminToken() => Promise<string>` — creates a `User` with `role: 'admin'` and returns a signed JWT
    - `createStudentToken(student) => string` — signs `{ id, role: 'student' }`

- [ ] **Step 1: Write the shared factories**

Create `sahlearn-api/tests/factories.js`:

```js
const jwt = require('jsonwebtoken');
const DailyQuiz = require('../src/models/DailyQuiz');
const Student = require('../src/models/Student');
const User = require('../src/models/User');
const { lagosDateKey } = require('../src/utils/dateKey');

let counter = 0;
const uniq = () => `${Date.now()}${(counter += 1)}`;

const makeQuestions = (n = 5) =>
  Array.from({ length: n }, (_, i) => ({
    text: `Question ${i + 1}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: i % 4,
    points: 1,
  }));

const createQuiz = (overrides = {}) =>
  DailyQuiz.create({
    date: lagosDateKey(),
    title: 'Quiz of the day',
    description: 'Five quick questions.',
    questions: makeQuestions(),
    isPublished: true,
    publishedAt: new Date(),
    ...overrides,
  });

const createStudent = (overrides = {}) => {
  const n = uniq();
  return Student.create({
    studentId: `SAH/${n}`,
    fullName: 'Test Student',
    email: `student${n}@example.com`,
    password: 'password123',
    isActive: true,
    ...overrides,
  });
};

const createAdminToken = async () => {
  const n = uniq();
  const admin = await User.create({
    name: 'Test Admin',
    email: `admin${n}@example.com`,
    password: 'password123',
    role: 'admin',
  });
  return jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const createStudentToken = (student) =>
  jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1h' });

module.exports = { makeQuestions, createQuiz, createStudent, createAdminToken, createStudentToken };
```

Before moving on, open `sahlearn-api/src/models/User.js` and confirm the field names used above (`name`, `email`, `password`, `role`, and whether `isActive` defaults to true). Adjust `createAdminToken` to match the real schema — the rest of the plan assumes this factory produces a usable admin token.

- [ ] **Step 2: Write the failing test**

Create `sahlearn-api/tests/unit/dailyQuizAttempt.model.test.js`:

```js
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const { createQuiz, createStudent } = require('../factories');

describe('DailyQuizAttempt model', () => {
  test('defaults to in_progress and unverified', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    const attempt = await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
      maxScore: quiz.totalPoints,
    });
    expect(attempt.status).toBe('in_progress');
    expect(attempt.verified).toBe(false);
    expect(attempt.score).toBe(0);
  });

  test('allows only one attempt per student per date', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    const base = { quiz: quiz._id, quizDate: quiz.date, student: student._id, startedAt: new Date() };
    await DailyQuizAttempt.create(base);
    await DailyQuizAttempt.init();
    await expect(DailyQuizAttempt.create(base)).rejects.toThrow();
  });

  test('allows the same student on a different date', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await DailyQuizAttempt.init();
    await DailyQuizAttempt.create({ quiz: quiz._id, quizDate: '2026-09-21', student: student._id, startedAt: new Date() });
    await expect(
      DailyQuizAttempt.create({ quiz: quiz._id, quizDate: '2026-09-22', student: student._id, startedAt: new Date() })
    ).resolves.toBeDefined();
  });

  test('never exposes ipHash in JSON', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    const attempt = await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
      ipHash: 'deadbeef',
    });
    const json = attempt.toJSON();
    expect(json.ipHash).toBeUndefined();
    expect(json.id).toBeDefined();
    expect(json._id).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `cd sahlearn-api && npx jest tests/unit/dailyQuizAttempt.model.test.js`
Expected: FAIL — `Cannot find module '../../src/models/DailyQuizAttempt'`

- [ ] **Step 4: Implement the model**

Create `sahlearn-api/src/models/DailyQuizAttempt.js`:

```js
// sahlearn-api/src/models/DailyQuizAttempt.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedIndex: { type: Number },
  },
  { _id: false }
);

const dailyQuizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyQuiz', required: true },
    // Denormalized from quiz.date so leaderboard and history queries never join.
    quizDate: { type: String, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    durationMs: { type: Number },
    status: { type: String, enum: ['in_progress', 'submitted'], default: 'in_progress' },
    // false = the student proved only their ID, no password. Flipping the access
    // model later sets this true without a migration.
    verified: { type: Boolean, default: false },
    ipHash: { type: String },
  },
  { timestamps: true }
);

dailyQuizAttemptSchema.index({ quizDate: 1, student: 1 }, { unique: true });
dailyQuizAttemptSchema.index({ quizDate: 1, score: -1, durationMs: 1 });
dailyQuizAttemptSchema.index({ student: 1, quizDate: -1 });

dailyQuizAttemptSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.ipHash;
    return ret;
  },
});

module.exports = mongoose.model('DailyQuizAttempt', dailyQuizAttemptSchema);
```

- [ ] **Step 5: Run it and watch it pass**

Run: `cd sahlearn-api && npx jest tests/unit/dailyQuizAttempt.model.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 6: Run the whole suite**

Run: `cd sahlearn-api && npm test`
Expected: PASS, 3 suites.

- [ ] **Step 7: Commit**

```bash
git add sahlearn-api/src/models/DailyQuizAttempt.js sahlearn-api/tests
git commit -m "feat(api): add DailyQuizAttempt model and shared test factories

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: `GET /api/daily-quiz/today` and the public router mount

First task that wires a route into `app.js`. Later public tasks extend the same router and controller.

**Files:**
- Create: `sahlearn-api/src/controllers/dailyQuiz.controller.js`
- Create: `sahlearn-api/src/routes/dailyQuiz.routes.js`
- Modify: `sahlearn-api/src/app.js`
- Modify: `sahlearn-api/src/middleware/rateLimit.js`
- Test: `sahlearn-api/tests/integration/dailyQuiz.today.test.js`

**Interfaces:**
- Consumes: `DailyQuiz` (Task 2), `lagosDateKey` (Task 1), factories (Task 3).
- Produces:
  - `getToday(req, res)` exported from `dailyQuiz.controller.js`.
  - Route `GET /api/daily-quiz/today`.
  - `quizReadLimiter`, `quizStartLimiter`, `quizSubmitLimiter` exported from `rateLimit.js` (all three added now so later tasks only import them).

- [ ] **Step 1: Add the rate limiters**

In `sahlearn-api/src/middleware/rateLimit.js`, add next to the existing limiters and include them in `module.exports`:

```js
const quizReadLimiter = makeRateLimiter(60, 15, 'Too many requests. Please slow down.');
const quizStartLimiter = makeRateLimiter(10, 60, 'Too many quiz attempts from this network. Try again later.');
const quizSubmitLimiter = makeRateLimiter(20, 60, 'Too many submissions. Try again later.');
```

```js
module.exports = {
  globalLimiter,
  loginLimiter,
  contactLimiter,
  enrollmentLimiter,
  checkinLimiter,
  quizReadLimiter,
  quizStartLimiter,
  quizSubmitLimiter,
};
```

- [ ] **Step 2: Write the failing test**

Create `sahlearn-api/tests/integration/dailyQuiz.today.test.js`:

```js
const request = require('supertest');
const app = require('../../src/app');
const { createQuiz } = require('../factories');
const { lagosDateKey } = require('../../src/utils/dateKey');

describe('GET /api/daily-quiz/today', () => {
  test('reports unavailable when no quiz exists', async () => {
    const res = await request(app).get('/api/daily-quiz/today');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.available).toBe(false);
  });

  test('reports unavailable when today\'s quiz is unpublished', async () => {
    await createQuiz({ isPublished: false });
    const res = await request(app).get('/api/daily-quiz/today');
    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(false);
  });

  test('reports unavailable when the only published quiz is for another day', async () => {
    await createQuiz({ date: '2020-01-01' });
    const res = await request(app).get('/api/daily-quiz/today');
    expect(res.body.data.available).toBe(false);
  });

  test('returns metadata for today\'s published quiz', async () => {
    const quiz = await createQuiz({ title: 'Monday Mix', description: 'Warm up.' });
    const res = await request(app).get('/api/daily-quiz/today');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      available: true,
      date: lagosDateKey(),
      title: 'Monday Mix',
      description: 'Warm up.',
      questionCount: 5,
      totalPoints: quiz.totalPoints,
    });
  });

  test('never leaks questions or correct answers', async () => {
    await createQuiz();
    const res = await request(app).get('/api/daily-quiz/today');
    expect(res.body.data.questions).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('correctIndex');
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `cd sahlearn-api && npx jest tests/integration/dailyQuiz.today.test.js`
Expected: FAIL — 404 `Route not found`, because nothing is mounted yet.

- [ ] **Step 4: Write the controller**

Create `sahlearn-api/src/controllers/dailyQuiz.controller.js`:

```js
// sahlearn-api/src/controllers/dailyQuiz.controller.js
// Public, unauthenticated daily quiz endpoints. Nothing here may return
// correctIndex except the submit result.
const DailyQuiz = require('../models/DailyQuiz');
const { lagosDateKey } = require('../utils/dateKey');
const { success } = require('../utils/apiResponse');

const findTodaysQuiz = () => DailyQuiz.findOne({ date: lagosDateKey(), isPublished: true });

/* ── GET /api/daily-quiz/today ── */
const getToday = async (_req, res) => {
  const quiz = await findTodaysQuiz().lean();
  if (!quiz) return success(res, { available: false });

  success(res, {
    available: true,
    date: quiz.date,
    title: quiz.title,
    description: quiz.description || '',
    questionCount: quiz.questions.length,
    totalPoints: quiz.totalPoints,
  });
};

module.exports = { getToday, findTodaysQuiz };
```

- [ ] **Step 5: Write the router**

Create `sahlearn-api/src/routes/dailyQuiz.routes.js`:

```js
// sahlearn-api/src/routes/dailyQuiz.routes.js — PUBLIC. No auth middleware here.
const express = require('express');
const router = express.Router();
const { quizReadLimiter } = require('../middleware/rateLimit');
const { getToday } = require('../controllers/dailyQuiz.controller');

router.get('/today', quizReadLimiter, getToday);

module.exports = router;
```

- [ ] **Step 6: Mount it in `app.js`**

In `sahlearn-api/src/app.js`, add the require alongside the other route requires:

```js
const dailyQuizRoutes = require('./routes/dailyQuiz.routes');
```

and mount it with the other public routers, above the `/api/student/auth` block:

```js
app.use('/api/daily-quiz', dailyQuizRoutes);
```

- [ ] **Step 7: Run it and watch it pass**

Run: `cd sahlearn-api && npx jest tests/integration/dailyQuiz.today.test.js`
Expected: PASS, 5 tests.

- [ ] **Step 8: Commit**

```bash
git add sahlearn-api/src/controllers/dailyQuiz.controller.js sahlearn-api/src/routes/dailyQuiz.routes.js sahlearn-api/src/app.js sahlearn-api/src/middleware/rateLimit.js sahlearn-api/tests/integration/dailyQuiz.today.test.js
git commit -m "feat(api): add public GET /api/daily-quiz/today

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: `POST /api/daily-quiz/start`

**Files:**
- Create: `sahlearn-api/src/utils/attemptToken.js`
- Modify: `sahlearn-api/src/controllers/dailyQuiz.controller.js`
- Modify: `sahlearn-api/src/routes/dailyQuiz.routes.js`
- Test: `sahlearn-api/tests/integration/dailyQuiz.start.test.js`

**Interfaces:**
- Consumes: `findTodaysQuiz` (Task 4), `DailyQuizAttempt` (Task 3).
- Produces:
  - `signAttemptToken(attemptId) => string` and `verifyAttemptToken(token) => { attemptId } | null` from `src/utils/attemptToken.js`.
  - `hashIp(ip) => string` from the same file.
  - `startAttempt(req, res)` on the controller.
  - Route `POST /api/daily-quiz/start`, body `{ studentId }`.
  - Success payload: `{ attemptToken, date, title, description, startedAt, questions: [{ id, text, options, points }] }` — no `correctIndex`.

- [ ] **Step 1: Write the failing test**

Create `sahlearn-api/tests/integration/dailyQuiz.start.test.js`:

```js
const request = require('supertest');
const app = require('../../src/app');
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const { createQuiz, createStudent } = require('../factories');

const start = (studentId) => request(app).post('/api/daily-quiz/start').send({ studentId });

describe('POST /api/daily-quiz/start', () => {
  test('422 when studentId is missing', async () => {
    await createQuiz();
    const res = await request(app).post('/api/daily-quiz/start').send({});
    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('studentId');
  });

  test('404 for an unknown student ID', async () => {
    await createQuiz();
    const res = await start('SAH/nope');
    expect(res.status).toBe(404);
  });

  test('404 for an inactive student, with the same message as unknown', async () => {
    await createQuiz();
    const inactive = await createStudent({ isActive: false });
    const unknownRes = await start('SAH/nope');
    const inactiveRes = await start(inactive.studentId);
    expect(inactiveRes.status).toBe(404);
    // Identical wording, so the endpoint cannot be used to confirm an ID exists.
    expect(inactiveRes.body.message).toBe(unknownRes.body.message);
  });

  test('404 when no quiz is published today', async () => {
    const student = await createStudent();
    const res = await start(student.studentId);
    expect(res.status).toBe(404);
  });

  test('creates an attempt and returns questions without correctIndex', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    const res = await start(student.studentId);

    expect(res.status).toBe(201);
    expect(res.body.data.attemptToken).toEqual(expect.any(String));
    expect(res.body.data.questions).toHaveLength(5);
    expect(res.body.data.questions[0]).toEqual({
      id: expect.any(String),
      text: 'Question 1',
      options: ['A', 'B', 'C', 'D'],
      points: 1,
    });
    expect(JSON.stringify(res.body)).not.toContain('correctIndex');

    const attempt = await DailyQuizAttempt.findOne({ student: student._id });
    expect(attempt.status).toBe('in_progress');
    expect(attempt.quizDate).toBe(quiz.date);
    expect(attempt.maxScore).toBe(quiz.totalPoints);
    expect(attempt.startedAt).toBeInstanceOf(Date);
    expect(attempt.verified).toBe(false);
  });

  test('stores a hashed IP, never the raw one', async () => {
    await createQuiz();
    const student = await createStudent();
    await start(student.studentId);
    const attempt = await DailyQuizAttempt.findOne({ student: student._id }).lean();
    expect(attempt.ipHash).toEqual(expect.any(String));
    expect(attempt.ipHash).not.toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    expect(attempt.ipHash).not.toContain('::');
  });

  test('a second start resumes the same attempt and does not reset startedAt', async () => {
    await createQuiz();
    const student = await createStudent();
    const first = await start(student.studentId);
    const second = await start(student.studentId);

    expect(second.status).toBe(200);
    expect(second.body.data.startedAt).toBe(first.body.data.startedAt);
    expect(await DailyQuizAttempt.countDocuments({ student: student._id })).toBe(1);
  });

  test('409 with the existing result once the student has submitted today', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(Date.now() - 60000),
      submittedAt: new Date(),
      durationMs: 60000,
      score: 4,
      maxScore: 5,
      status: 'submitted',
    });

    const res = await start(student.studentId);
    expect(res.status).toBe(409);
    expect(res.body.data).toMatchObject({ score: 4, maxScore: 5, durationMs: 60000 });
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd sahlearn-api && npx jest tests/integration/dailyQuiz.start.test.js`
Expected: FAIL — 404 `Route not found` on every test.

- [ ] **Step 3: Write the attempt-token util**

Create `sahlearn-api/src/utils/attemptToken.js`:

```js
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
```

- [ ] **Step 4: Add `startAttempt` to the controller**

In `sahlearn-api/src/controllers/dailyQuiz.controller.js`, add the requires at the top:

```js
const DailyQuizAttempt = require('../models/DailyQuizAttempt');
const Student = require('../models/Student');
const { signAttemptToken, hashIp } = require('../utils/attemptToken');
```

Add this helper above the handlers — it is the single place that strips answers:

```js
// The one place questions are shaped for a client. Never add correctIndex here.
const publicQuestions = (quiz) =>
  quiz.questions.map((q) => ({
    id: String(q._id),
    text: q.text,
    options: q.options,
    points: q.points,
  }));
```

Then the handler:

```js
/* ── POST /api/daily-quiz/start ── */
const startAttempt = async (req, res) => {
  const { studentId } = req.body;

  const student = await Student.findOne({ studentId: studentId.trim() });
  // Same message for unknown and inactive, so this cannot be used to confirm
  // which IDs exist.
  if (!student || !student.isActive) {
    return res.status(404).json({ status: 'error', message: 'We could not find that student ID.' });
  }

  const quiz = await findTodaysQuiz();
  if (!quiz) {
    return res.status(404).json({ status: 'error', message: 'There is no quiz today. Check back tomorrow.' });
  }

  const existing = await DailyQuizAttempt.findOne({ quizDate: quiz.date, student: student._id });

  if (existing?.status === 'submitted') {
    return res.status(409).json({
      status: 'error',
      message: 'You already took today\'s quiz.',
      data: {
        score: existing.score,
        maxScore: existing.maxScore,
        durationMs: existing.durationMs,
        submittedAt: existing.submittedAt,
      },
    });
  }

  // Resuming: keep the original startedAt so a refresh cannot reset the clock.
  const attempt =
    existing ||
    (await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
      maxScore: quiz.totalPoints,
      ipHash: hashIp(req.ip),
    }));

  success(
    res,
    {
      attemptToken: signAttemptToken(attempt._id),
      date: quiz.date,
      title: quiz.title,
      description: quiz.description || '',
      startedAt: attempt.startedAt.toISOString(),
      questions: publicQuestions(quiz),
    },
    existing ? 200 : 201
  );
};
```

Export it: `module.exports = { getToday, startAttempt, findTodaysQuiz, publicQuestions };`

- [ ] **Step 5: Add the route**

In `sahlearn-api/src/routes/dailyQuiz.routes.js`:

```js
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { quizReadLimiter, quizStartLimiter } = require('../middleware/rateLimit');
const { getToday, startAttempt } = require('../controllers/dailyQuiz.controller');

router.post(
  '/start',
  quizStartLimiter,
  [body('studentId').trim().notEmpty().withMessage('Student ID is required').isLength({ max: 50 })],
  validate,
  startAttempt
);
```

- [ ] **Step 6: Run it and watch it pass**

Run: `cd sahlearn-api && npx jest tests/integration/dailyQuiz.start.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 7: Commit**

```bash
git add sahlearn-api/src/utils/attemptToken.js sahlearn-api/src/controllers/dailyQuiz.controller.js sahlearn-api/src/routes/dailyQuiz.routes.js sahlearn-api/tests/integration/dailyQuiz.start.test.js
git commit -m "feat(api): add POST /api/daily-quiz/start with attempt tokens

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: `POST /api/daily-quiz/submit` and server-side scoring

Owns Review Focus items 1, 2 and 4.

**Files:**
- Create: `sahlearn-api/src/utils/scoreQuiz.js`
- Modify: `sahlearn-api/src/controllers/dailyQuiz.controller.js`
- Modify: `sahlearn-api/src/routes/dailyQuiz.routes.js`
- Test: `sahlearn-api/tests/unit/scoreQuiz.test.js`
- Test: `sahlearn-api/tests/integration/dailyQuiz.submit.test.js`

**Interfaces:**
- Consumes: `verifyAttemptToken` (Task 5), `DailyQuizAttempt`, `DailyQuiz`.
- Produces:
  - `scoreQuiz(questions, answers) => { score, maxScore, results: [{ questionIndex, selectedIndex, correctIndex, isCorrect, points }] }` from `src/utils/scoreQuiz.js`.
  - `submitAttempt(req, res)` on the controller.
  - Route `POST /api/daily-quiz/submit`, body `{ attemptToken, answers: [{ questionIndex, selectedIndex }] }`.

- [ ] **Step 1: Write the failing scoring test**

Create `sahlearn-api/tests/unit/scoreQuiz.test.js`:

```js
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd sahlearn-api && npx jest tests/unit/scoreQuiz.test.js`
Expected: FAIL — `Cannot find module '../../src/utils/scoreQuiz'`

- [ ] **Step 3: Implement scoring**

Create `sahlearn-api/src/utils/scoreQuiz.js`:

```js
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
```

- [ ] **Step 4: Run it and watch it pass**

Run: `cd sahlearn-api && npx jest tests/unit/scoreQuiz.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 5: Write the failing submit test**

Create `sahlearn-api/tests/integration/dailyQuiz.submit.test.js`:

```js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const DailyQuiz = require('../../src/models/DailyQuiz');
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const Student = require('../../src/models/Student');
const { createQuiz, createStudent, createStudentToken } = require('../factories');
const { signAttemptToken } = require('../../src/utils/attemptToken');

// The factory sets correctIndex = i % 4, so all-correct answers are i % 4.
const correctAnswers = (n = 5) =>
  Array.from({ length: n }, (_, i) => ({ questionIndex: i, selectedIndex: i % 4 }));

const startFor = async (student) => {
  const res = await request(app).post('/api/daily-quiz/start').send({ studentId: student.studentId });
  return res.body.data.attemptToken;
};

const submit = (attemptToken, answers) =>
  request(app).post('/api/daily-quiz/submit').send({ attemptToken, answers });

describe('POST /api/daily-quiz/submit', () => {
  test('401 for a missing or malformed token', async () => {
    const res = await submit('not-a-token', []);
    expect(res.status).toBe(401);
  });

  test('401 for a student login token — wrong token kind', async () => {
    const student = await createStudent();
    const res = await submit(createStudentToken(student), []);
    expect(res.status).toBe(401);
  });

  test('401 for an expired attempt token', async () => {
    const expired = jwt.sign(
      { attemptId: '650000000000000000000000', kind: 'daily-quiz-attempt' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const res = await submit(expired, []);
    expect(res.status).toBe(401);
  });

  test('404 when the attempt no longer exists', async () => {
    const res = await submit(signAttemptToken('650000000000000000000000'), []);
    expect(res.status).toBe(404);
  });

  test('scores correctly and records a server-computed duration', async () => {
    await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);

    // Pretend the attempt started two minutes ago.
    await DailyQuizAttempt.updateOne(
      { student: student._id },
      { startedAt: new Date(Date.now() - 120000) }
    );

    const res = await submit(token, correctAnswers());
    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(5);
    expect(res.body.data.maxScore).toBe(5);
    expect(res.body.data.durationMs).toBeGreaterThanOrEqual(120000);
    expect(res.body.data.results).toHaveLength(5);
    expect(res.body.data.results[0]).toMatchObject({ isCorrect: true, correctIndex: 0 });
  });

  test('ignores a client-supplied duration', async () => {
    await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);
    await DailyQuizAttempt.updateOne({ student: student._id }, { startedAt: new Date(Date.now() - 90000) });

    const res = await request(app)
      .post('/api/daily-quiz/submit')
      .send({ attemptToken: token, answers: correctAnswers(), durationMs: 1, submittedAt: '1999-01-01' });

    expect(res.body.data.durationMs).toBeGreaterThanOrEqual(90000);
    const attempt = await DailyQuizAttempt.findOne({ student: student._id }).lean();
    expect(attempt.durationMs).toBeGreaterThanOrEqual(90000);
  });

  test('persists the attempt as submitted', async () => {
    await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);
    await submit(token, correctAnswers());

    const attempt = await DailyQuizAttempt.findOne({ student: student._id }).lean();
    expect(attempt.status).toBe('submitted');
    expect(attempt.score).toBe(5);
    expect(attempt.submittedAt).toBeInstanceOf(Date);
  });

  test('409 on a second submit with the same token', async () => {
    await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);
    await submit(token, correctAnswers());
    const second = await submit(token, correctAnswers());
    expect(second.status).toBe(409);
  });

  test('403 when the student was deactivated mid-attempt', async () => {
    await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);
    await Student.updateOne({ _id: student._id }, { isActive: false });

    const res = await submit(token, correctAnswers());
    expect(res.status).toBe(403);
    const attempt = await DailyQuizAttempt.findOne({ student: student._id }).lean();
    expect(attempt.status).toBe('in_progress');
  });

  test('404 when the quiz was deleted mid-attempt', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);
    await DailyQuiz.deleteOne({ _id: quiz._id });

    const res = await submit(token, correctAnswers());
    expect(res.status).toBe(404);
  });

  test('still scores when the quiz was unpublished mid-attempt', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    const token = await startFor(student);
    await DailyQuiz.updateOne({ _id: quiz._id }, { isPublished: false });

    const res = await submit(token, correctAnswers());
    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(5);
  });

  test('a token whose attempt belongs to another day scores against that day\'s quiz', async () => {
    // A token lives 3 hours and can cross midnight Lagos. The attempt carries
    // its own quiz reference, so it must never bind to "today".
    const oldQuiz = await createQuiz({ date: '2026-09-21', isPublished: true });
    const student = await createStudent();
    const attempt = await DailyQuizAttempt.create({
      quiz: oldQuiz._id,
      quizDate: '2026-09-21',
      student: student._id,
      startedAt: new Date(Date.now() - 60000),
      maxScore: oldQuiz.totalPoints,
    });
    await createQuiz(); // today's quiz also exists

    const res = await submit(signAttemptToken(attempt._id), correctAnswers());
    expect(res.status).toBe(200);
    const saved = await DailyQuizAttempt.findById(attempt._id).lean();
    expect(saved.quizDate).toBe('2026-09-21');
    expect(String(saved.quiz)).toBe(String(oldQuiz._id));
  });
});
```

- [ ] **Step 6: Run it and watch it fail**

Run: `cd sahlearn-api && npx jest tests/integration/dailyQuiz.submit.test.js`
Expected: FAIL — 404 `Route not found`.

- [ ] **Step 7: Add `submitAttempt` to the controller**

In `sahlearn-api/src/controllers/dailyQuiz.controller.js`, extend the requires:

```js
const { signAttemptToken, verifyAttemptToken, hashIp } = require('../utils/attemptToken');
const { scoreQuiz } = require('../utils/scoreQuiz');
```

Add the handler:

```js
/* ── POST /api/daily-quiz/submit ── */
const submitAttempt = async (req, res) => {
  const payload = verifyAttemptToken(req.body.attemptToken);
  if (!payload) {
    return res.status(401).json({ status: 'error', message: 'Your quiz session has expired. Start again.' });
  }

  const attempt = await DailyQuizAttempt.findById(payload.attemptId);
  if (!attempt) {
    return res.status(404).json({ status: 'error', message: 'Attempt not found.' });
  }
  if (attempt.status === 'submitted') {
    return res.status(409).json({ status: 'error', message: 'This attempt was already submitted.' });
  }

  // Re-check the student: /start validated them, but that was up to 3 hours ago.
  const student = await Student.findById(attempt.student);
  if (!student || !student.isActive) {
    return res.status(403).json({ status: 'error', message: 'This account can no longer take the quiz.' });
  }

  // Score against the attempt's own quiz, never "today's" — a token can cross
  // midnight Lagos.
  const quiz = await DailyQuiz.findById(attempt.quiz);
  if (!quiz) {
    return res.status(404).json({ status: 'error', message: 'This quiz is no longer available.' });
  }

  const { score, maxScore, results } = scoreQuiz(quiz.questions, req.body.answers);

  const submittedAt = new Date();
  attempt.answers = results.map((r) => ({
    questionIndex: r.questionIndex,
    selectedIndex: r.selectedIndex,
  }));
  attempt.score = score;
  attempt.maxScore = maxScore;
  attempt.submittedAt = submittedAt;
  // Computed from the stored startedAt. Anything the client sent is ignored.
  attempt.durationMs = submittedAt.getTime() - attempt.startedAt.getTime();
  attempt.status = 'submitted';
  await attempt.save();

  success(res, {
    date: attempt.quizDate,
    score,
    maxScore,
    durationMs: attempt.durationMs,
    submittedAt: submittedAt.toISOString(),
    results,
  });
};
```

Export it alongside the others.

- [ ] **Step 8: Add the route**

In `sahlearn-api/src/routes/dailyQuiz.routes.js`:

```js
router.post(
  '/submit',
  quizSubmitLimiter,
  [
    body('attemptToken').isString().notEmpty().withMessage('Missing quiz session'),
    body('answers').optional().isArray({ max: 50 }).withMessage('answers must be an array'),
  ],
  validate,
  submitAttempt
);
```

Remember to add `quizSubmitLimiter` to the `rateLimit` require and `submitAttempt` to the controller require at the top of the file.

- [ ] **Step 9: Run it and watch it pass**

Run: `cd sahlearn-api && npx jest tests/integration/dailyQuiz.submit.test.js`
Expected: PASS, 12 tests.

- [ ] **Step 10: Commit**

```bash
git add sahlearn-api/src/utils/scoreQuiz.js sahlearn-api/src/controllers/dailyQuiz.controller.js sahlearn-api/src/routes/dailyQuiz.routes.js sahlearn-api/tests
git commit -m "feat(api): add POST /api/daily-quiz/submit with server-side scoring and timing

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: `GET /api/daily-quiz/leaderboard`

Owns Review Focus items 3 and 5.

**Files:**
- Modify: `sahlearn-api/src/controllers/dailyQuiz.controller.js`
- Modify: `sahlearn-api/src/routes/dailyQuiz.routes.js`
- Test: `sahlearn-api/tests/integration/dailyQuiz.leaderboard.test.js`

**Interfaces:**
- Consumes: `DailyQuizAttempt`, `lagosDateKey`.
- Produces: `getLeaderboard(req, res)`; route `GET /api/daily-quiz/leaderboard?date=YYYY-MM-DD`.
  Payload: `{ date, entries: [{ rank, fullName, score, maxScore, durationMs }] }`, max 20 entries.

- [ ] **Step 1: Write the failing test**

Create `sahlearn-api/tests/integration/dailyQuiz.leaderboard.test.js`:

```js
const request = require('supertest');
const app = require('../../src/app');
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const { createQuiz, createStudent } = require('../factories');
const { lagosDateKey } = require('../../src/utils/dateKey');

const submitted = async (quiz, fullName, score, durationMs) => {
  const student = await createStudent({ fullName });
  return DailyQuizAttempt.create({
    quiz: quiz._id,
    quizDate: quiz.date,
    student: student._id,
    startedAt: new Date(Date.now() - durationMs),
    submittedAt: new Date(),
    durationMs,
    score,
    maxScore: quiz.totalPoints,
    status: 'submitted',
  });
};

describe('GET /api/daily-quiz/leaderboard', () => {
  test('returns an empty board when nobody has played', async () => {
    await createQuiz();
    const res = await request(app).get('/api/daily-quiz/leaderboard');
    expect(res.status).toBe(200);
    expect(res.body.data.entries).toEqual([]);
    expect(res.body.data.date).toBe(lagosDateKey());
  });

  test('ranks by score, then by the faster time', async () => {
    const quiz = await createQuiz();
    await submitted(quiz, 'Slow High', 5, 300000);
    await submitted(quiz, 'Fast High', 5, 60000);
    await submitted(quiz, 'Fast Low', 3, 10000);

    const res = await request(app).get('/api/daily-quiz/leaderboard');
    expect(res.body.data.entries.map((e) => e.fullName)).toEqual(['Fast High', 'Slow High', 'Fast Low']);
    expect(res.body.data.entries.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  test('excludes in-progress attempts', async () => {
    const quiz = await createQuiz();
    const student = await createStudent({ fullName: 'Still Going' });
    await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
    });
    const res = await request(app).get('/api/daily-quiz/leaderboard');
    expect(res.body.data.entries).toEqual([]);
  });

  test('excludes attempts whose quiz is no longer published', async () => {
    const quiz = await createQuiz({ isPublished: false });
    await submitted(quiz, 'Hidden', 5, 1000);
    const res = await request(app).get('/api/daily-quiz/leaderboard');
    expect(res.body.data.entries).toEqual([]);
  });

  test('honours an explicit date', async () => {
    const past = await createQuiz({ date: '2026-09-20' });
    await submitted(past, 'Yesterday Hero', 5, 1000);
    const res = await request(app).get('/api/daily-quiz/leaderboard?date=2026-09-20');
    expect(res.body.data.date).toBe('2026-09-20');
    expect(res.body.data.entries[0].fullName).toBe('Yesterday Hero');
  });

  test('a malformed date returns an empty board, not a 500', async () => {
    await createQuiz();
    for (const bad of ['banana', '2026-13-45', '', '../../etc/passwd', '2026-9-1']) {
      const res = await request(app).get(`/api/daily-quiz/leaderboard?date=${encodeURIComponent(bad)}`);
      expect(res.status).toBe(200);
      expect(res.body.data.entries).toEqual([]);
    }
  });

  test('a future date returns an empty board', async () => {
    await createQuiz();
    const res = await request(app).get('/api/daily-quiz/leaderboard?date=2099-01-01');
    expect(res.status).toBe(200);
    expect(res.body.data.entries).toEqual([]);
  });

  test('never exposes email or student ID', async () => {
    const quiz = await createQuiz();
    const attempt = await submitted(quiz, 'Visible Name', 5, 1000);
    const res = await request(app).get('/api/daily-quiz/leaderboard');
    const body = JSON.stringify(res.body);
    expect(body).not.toContain('@example.com');
    expect(body).not.toContain('SAH/');
    expect(res.body.data.entries[0]).toEqual({
      rank: 1,
      fullName: 'Visible Name',
      score: 5,
      maxScore: quiz.totalPoints,
      durationMs: 1000,
    });
    expect(attempt).toBeDefined();
  });

  test('caps the board at 20 entries', async () => {
    const quiz = await createQuiz();
    for (let i = 0; i < 22; i += 1) {
      await submitted(quiz, `Player ${i}`, 5, 1000 + i);
    }
    const res = await request(app).get('/api/daily-quiz/leaderboard');
    expect(res.body.data.entries).toHaveLength(20);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd sahlearn-api && npx jest tests/integration/dailyQuiz.leaderboard.test.js`
Expected: FAIL — 404 `Route not found`.

- [ ] **Step 3: Implement the handler**

In `sahlearn-api/src/controllers/dailyQuiz.controller.js`:

```js
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const LEADERBOARD_SIZE = 20;

/* ── GET /api/daily-quiz/leaderboard ── */
const getLeaderboard = async (req, res) => {
  const requested = (req.query.date || '').trim();
  // A junk date is not an error — it is simply a day with no board.
  const date = DATE_KEY.test(requested) ? requested : requested ? null : lagosDateKey();

  if (!date) {
    return success(res, { date: requested, entries: [] });
  }

  // Only published quizzes have a public board. An admin unpublishing a day
  // pulls it off the board without touching the recorded attempts.
  const quiz = await DailyQuiz.findOne({ date, isPublished: true }).select('_id').lean();
  if (!quiz) return success(res, { date, entries: [] });

  const attempts = await DailyQuizAttempt.find({ quizDate: date, status: 'submitted' })
    .sort({ score: -1, durationMs: 1 })
    .limit(LEADERBOARD_SIZE)
    .populate('student', 'fullName')
    .select('score maxScore durationMs student')
    .lean();

  success(res, {
    date,
    entries: attempts.map((a, i) => ({
      rank: i + 1,
      fullName: a.student?.fullName || 'Student',
      score: a.score,
      maxScore: a.maxScore,
      durationMs: a.durationMs,
    })),
  });
};
```

- [ ] **Step 4: Add the route**

In `sahlearn-api/src/routes/dailyQuiz.routes.js`:

```js
router.get('/leaderboard', quizReadLimiter, getLeaderboard);
```

- [ ] **Step 5: Run it and watch it pass**

Run: `cd sahlearn-api && npx jest tests/integration/dailyQuiz.leaderboard.test.js`
Expected: PASS, 9 tests.

- [ ] **Step 6: Commit**

```bash
git add sahlearn-api/src/controllers/dailyQuiz.controller.js sahlearn-api/src/routes/dailyQuiz.routes.js sahlearn-api/tests/integration/dailyQuiz.leaderboard.test.js
git commit -m "feat(api): add public daily quiz leaderboard

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 8: Student history endpoint and streak

**Files:**
- Create: `sahlearn-api/src/controllers/student.dailyQuiz.controller.js`
- Create: `sahlearn-api/src/routes/student.dailyQuiz.routes.js`
- Create: `sahlearn-api/src/utils/streak.js`
- Modify: `sahlearn-api/src/app.js`
- Test: `sahlearn-api/tests/unit/streak.test.js`
- Test: `sahlearn-api/tests/integration/studentDailyQuiz.history.test.js`

**Interfaces:**
- Consumes: `DailyQuizAttempt`, `studentAuthMiddleware`, `lagosDateKey`.
- Produces:
  - `currentStreak(dateKeys: string[], today: string) => number` from `src/utils/streak.js`.
  - Route `GET /api/student/daily-quiz/history?page=&limit=` returning `successList` with `meta` plus a top-level `stats` key.

- [ ] **Step 1: Write the failing streak test**

Create `sahlearn-api/tests/unit/streak.test.js`:

```js
const { currentStreak } = require('../../src/utils/streak');

describe('currentStreak', () => {
  test('is zero with no history', () => {
    expect(currentStreak([], '2026-09-22')).toBe(0);
  });

  test('counts consecutive days ending today', () => {
    expect(currentStreak(['2026-09-22', '2026-09-21', '2026-09-20'], '2026-09-22')).toBe(3);
  });

  test('counts a run ending yesterday, since today is not over', () => {
    expect(currentStreak(['2026-09-21', '2026-09-20'], '2026-09-22')).toBe(2);
  });

  test('is zero when the last play was two days ago', () => {
    expect(currentStreak(['2026-09-20', '2026-09-19'], '2026-09-22')).toBe(0);
  });

  test('stops at the first gap', () => {
    expect(currentStreak(['2026-09-22', '2026-09-21', '2026-09-19'], '2026-09-22')).toBe(2);
  });

  test('is unaffected by input order or duplicates', () => {
    expect(currentStreak(['2026-09-21', '2026-09-22', '2026-09-22'], '2026-09-22')).toBe(2);
  });

  test('crosses a month boundary', () => {
    expect(currentStreak(['2026-10-01', '2026-09-30'], '2026-10-01')).toBe(2);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd sahlearn-api && npx jest tests/unit/streak.test.js`
Expected: FAIL — `Cannot find module '../../src/utils/streak'`

- [ ] **Step 3: Implement the streak**

Create `sahlearn-api/src/utils/streak.js`:

```js
// sahlearn-api/src/utils/streak.js
const DAY_MS = 24 * 60 * 60 * 1000;

const shift = (key, days) =>
  new Date(new Date(`${key}T00:00:00Z`).getTime() + days * DAY_MS).toISOString().slice(0, 10);

// Counts back from today, or from yesterday when today has not been played —
// a student mid-morning has not broken their streak yet.
function currentStreak(dateKeys, today) {
  const played = new Set(dateKeys);
  if (played.size === 0) return 0;

  let cursor = played.has(today) ? today : shift(today, -1);
  if (!played.has(cursor)) return 0;

  let streak = 0;
  while (played.has(cursor)) {
    streak += 1;
    cursor = shift(cursor, -1);
  }
  return streak;
}

module.exports = { currentStreak };
```

`shift` deliberately does its arithmetic in UTC on a date-only key. The keys are already Lagos dates, so this is pure string arithmetic with no timezone applied twice.

- [ ] **Step 4: Run it and watch it pass**

Run: `cd sahlearn-api && npx jest tests/unit/streak.test.js`
Expected: PASS, 7 tests.

- [ ] **Step 5: Write the failing history test**

Create `sahlearn-api/tests/integration/studentDailyQuiz.history.test.js`:

```js
const request = require('supertest');
const app = require('../../src/app');
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const { createQuiz, createStudent, createStudentToken } = require('../factories');
const { lagosDateKey } = require('../../src/utils/dateKey');

const attemptFor = (quiz, student, overrides = {}) =>
  DailyQuizAttempt.create({
    quiz: quiz._id,
    quizDate: quiz.date,
    student: student._id,
    startedAt: new Date(Date.now() - 60000),
    submittedAt: new Date(),
    durationMs: 60000,
    score: 4,
    maxScore: 5,
    status: 'submitted',
    ...overrides,
  });

describe('GET /api/student/daily-quiz/history', () => {
  test('401 without a student token', async () => {
    const res = await request(app).get('/api/student/daily-quiz/history');
    expect(res.status).toBe(401);
  });

  test('returns an empty history with zeroed stats', async () => {
    const student = await createStudent();
    const res = await request(app)
      .get('/api/student/daily-quiz/history')
      .set('Authorization', `Bearer ${createStudentToken(student)}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta).toMatchObject({ page: 1, total: 0, totalPages: 0 });
    expect(res.body.stats).toEqual({ totalTaken: 0, averageScore: 0, bestScore: 0, currentStreak: 0 });
  });

  test('returns only the caller\'s submitted attempts, newest first', async () => {
    const quiz = await createQuiz();
    const other = await createQuiz({ date: '2026-09-20' });
    const me = await createStudent();
    const someoneElse = await createStudent();

    await attemptFor(quiz, me, { score: 5 });
    await attemptFor(other, me, { quizDate: '2026-09-20', score: 2 });
    await attemptFor(quiz, someoneElse, { score: 1 });

    const res = await request(app)
      .get('/api/student/daily-quiz/history')
      .set('Authorization', `Bearer ${createStudentToken(me)}`);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].date).toBe(lagosDateKey());
    expect(res.body.data[0]).toMatchObject({ score: 5, maxScore: 5, durationMs: 60000, title: quiz.title });
  });

  test('excludes in-progress attempts from history and stats', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
    });

    const res = await request(app)
      .get('/api/student/daily-quiz/history')
      .set('Authorization', `Bearer ${createStudentToken(student)}`);

    expect(res.body.data).toEqual([]);
    expect(res.body.stats.totalTaken).toBe(0);
  });

  test('computes stats across every attempt, not just the current page', async () => {
    const student = await createStudent();
    const scores = [5, 3, 1];
    for (let i = 0; i < scores.length; i += 1) {
      const date = `2026-09-${String(20 + i).padStart(2, '0')}`;
      const quiz = await createQuiz({ date });
      await attemptFor(quiz, student, { quizDate: date, score: scores[i] });
    }

    const res = await request(app)
      .get('/api/student/daily-quiz/history?limit=1')
      .set('Authorization', `Bearer ${createStudentToken(student)}`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 1, total: 3, totalPages: 3 });
    expect(res.body.stats).toMatchObject({ totalTaken: 3, bestScore: 5, averageScore: 3 });
  });

  test('never exposes correct answers', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await attemptFor(quiz, student);
    const res = await request(app)
      .get('/api/student/daily-quiz/history')
      .set('Authorization', `Bearer ${createStudentToken(student)}`);
    expect(JSON.stringify(res.body)).not.toContain('correctIndex');
  });
});
```

- [ ] **Step 6: Run it and watch it fail**

Run: `cd sahlearn-api && npx jest tests/integration/studentDailyQuiz.history.test.js`
Expected: FAIL — 404 `Route not found` (and 401 only on the first test).

- [ ] **Step 7: Write the controller**

Create `sahlearn-api/src/controllers/student.dailyQuiz.controller.js`:

```js
// sahlearn-api/src/controllers/student.dailyQuiz.controller.js
const DailyQuizAttempt = require('../models/DailyQuizAttempt');
const { lagosDateKey } = require('../utils/dateKey');
const { currentStreak } = require('../utils/streak');

/* ── GET /api/student/daily-quiz/history ── */
const getMyHistory = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
  const filter = { student: req.student._id, status: 'submitted' };

  const [total, attempts, allDates, aggregate] = await Promise.all([
    DailyQuizAttempt.countDocuments(filter),
    DailyQuizAttempt.find(filter)
      .sort({ quizDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('quiz', 'title')
      .select('quizDate score maxScore durationMs submittedAt quiz')
      .lean(),
    DailyQuizAttempt.find(filter).select('quizDate').lean(),
    // Stats cover every attempt, not just this page.
    DailyQuizAttempt.aggregate([
      { $match: filter },
      { $group: { _id: null, avg: { $avg: '$score' }, best: { $max: '$score' } } },
    ]),
  ]);

  const stats = {
    totalTaken: total,
    averageScore: total ? Math.round((aggregate[0]?.avg || 0) * 10) / 10 : 0,
    bestScore: aggregate[0]?.best || 0,
    currentStreak: currentStreak(allDates.map((a) => a.quizDate), lagosDateKey()),
  };

  res.status(200).json({
    status: 'success',
    data: attempts.map((a) => ({
      id: a._id,
      date: a.quizDate,
      title: a.quiz?.title || 'Daily quiz',
      score: a.score,
      maxScore: a.maxScore,
      durationMs: a.durationMs,
      submittedAt: a.submittedAt,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats,
  });
};

module.exports = { getMyHistory };
```

- [ ] **Step 8: Write the router and mount it**

Create `sahlearn-api/src/routes/student.dailyQuiz.routes.js`:

```js
const express = require('express');
const router = express.Router();
const studentAuth = require('../middleware/studentAuth');
const { getMyHistory } = require('../controllers/student.dailyQuiz.controller');

router.use(studentAuth);
router.get('/history', getMyHistory);

module.exports = router;
```

In `sahlearn-api/src/app.js`, require it and mount it **with the other specific `/api/student/*` routers, above `app.use('/api/student', studentRoutes)`**:

```js
const studentDailyQuizRoutes = require('./routes/student.dailyQuiz.routes');
```

```js
app.use('/api/student/daily-quiz', studentDailyQuizRoutes);
```

- [ ] **Step 9: Run it and watch it pass**

Run: `cd sahlearn-api && npx jest tests/integration/studentDailyQuiz.history.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 10: Commit**

```bash
git add sahlearn-api/src/controllers/student.dailyQuiz.controller.js sahlearn-api/src/routes/student.dailyQuiz.routes.js sahlearn-api/src/utils/streak.js sahlearn-api/src/app.js sahlearn-api/tests
git commit -m "feat(api): add student daily quiz history with stats and streak

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 9: Admin CRUD and results

**Files:**
- Create: `sahlearn-api/src/controllers/admin.dailyQuizzes.controller.js`
- Create: `sahlearn-api/src/routes/admin.dailyQuizzes.routes.js`
- Modify: `sahlearn-api/src/app.js`
- Test: `sahlearn-api/tests/integration/adminDailyQuizzes.test.js`

**Interfaces:**
- Consumes: `DailyQuiz`, `DailyQuizAttempt`, `authMiddleware`, `lagosDateKey`.
- Produces routes under `/api/admin/daily-quizzes`: `GET /`, `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `GET /:id/results`.

- [ ] **Step 1: Write the failing test**

Create `sahlearn-api/tests/integration/adminDailyQuizzes.test.js`:

```js
const request = require('supertest');
const app = require('../../src/app');
const DailyQuiz = require('../../src/models/DailyQuiz');
const DailyQuizAttempt = require('../../src/models/DailyQuizAttempt');
const { createQuiz, createStudent, createAdminToken, createStudentToken, makeQuestions } = require('../factories');
const { lagosDateKey } = require('../../src/utils/dateKey');

let token;
beforeEach(async () => {
  token = await createAdminToken();
});

const auth = (req) => req.set('Authorization', `Bearer ${token}`);

describe('admin daily quizzes', () => {
  test('401 without a token', async () => {
    const res = await request(app).get('/api/admin/daily-quizzes');
    expect(res.status).toBe(401);
  });

  test('403 for a student token', async () => {
    const student = await createStudent();
    const res = await request(app)
      .get('/api/admin/daily-quizzes')
      .set('Authorization', `Bearer ${createStudentToken(student)}`);
    expect([401, 403]).toContain(res.status);
  });

  test('creates a quiz dated today by default', async () => {
    const res = await auth(request(app).post('/api/admin/daily-quizzes')).send({
      title: 'Fresh quiz',
      questions: makeQuestions(),
    });
    expect(res.status).toBe(201);
    expect(res.body.data.date).toBe(lagosDateKey());
    expect(res.body.data.isPublished).toBe(false);
    expect(res.body.data.totalPoints).toBe(5);
  });

  test('422 for fewer than 5 questions', async () => {
    const res = await auth(request(app).post('/api/admin/daily-quizzes')).send({
      title: 'Too short',
      questions: makeQuestions(3),
    });
    expect(res.status).toBe(422);
  });

  test('409 for a duplicate date', async () => {
    await createQuiz({ date: '2026-09-22' });
    const res = await auth(request(app).post('/api/admin/daily-quizzes')).send({
      date: '2026-09-22',
      title: 'Second',
      questions: makeQuestions(),
    });
    expect(res.status).toBe(409);
  });

  test('lists quizzes newest date first with attempt counts', async () => {
    const older = await createQuiz({ date: '2026-09-20' });
    await createQuiz({ date: '2026-09-21' });
    const student = await createStudent();
    await DailyQuizAttempt.create({
      quiz: older._id,
      quizDate: older.date,
      student: student._id,
      startedAt: new Date(),
      submittedAt: new Date(),
      durationMs: 1000,
      status: 'submitted',
    });

    const res = await auth(request(app).get('/api/admin/daily-quizzes'));
    expect(res.body.data.map((q) => q.date)).toEqual(['2026-09-21', '2026-09-20']);
    expect(res.body.data[1].attemptCount).toBe(1);
    expect(res.body.meta.total).toBe(2);
  });

  test('a single quiz includes correctIndex for the admin', async () => {
    const quiz = await createQuiz();
    const res = await auth(request(app).get(`/api/admin/daily-quizzes/${quiz.id}`));
    expect(res.status).toBe(200);
    expect(res.body.data.questions[0].correctIndex).toBe(0);
  });

  test('404 for an unknown id', async () => {
    const res = await auth(request(app).get('/api/admin/daily-quizzes/650000000000000000000000'));
    expect(res.status).toBe(404);
  });

  test('400 for a malformed id instead of a 500', async () => {
    const res = await auth(request(app).get('/api/admin/daily-quizzes/not-an-id'));
    expect(res.status).toBe(400);
  });

  test('publishing sets publishedAt', async () => {
    const quiz = await createQuiz({ isPublished: false, publishedAt: null });
    const res = await auth(request(app).patch(`/api/admin/daily-quizzes/${quiz.id}`)).send({ isPublished: true });
    expect(res.status).toBe(200);
    expect(res.body.data.isPublished).toBe(true);
    expect(res.body.data.publishedAt).toBeTruthy();
  });

  test('questions stay editable while nobody has submitted', async () => {
    const quiz = await createQuiz();
    const questions = makeQuestions(6);
    const res = await auth(request(app).patch(`/api/admin/daily-quizzes/${quiz.id}`)).send({ questions });
    expect(res.status).toBe(200);
    expect(res.body.data.questions).toHaveLength(6);
  });

  test('409 when editing questions after a submitted attempt exists', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
      submittedAt: new Date(),
      durationMs: 1000,
      status: 'submitted',
    });

    const res = await auth(request(app).patch(`/api/admin/daily-quizzes/${quiz.id}`)).send({
      questions: makeQuestions(6),
    });
    expect(res.status).toBe(409);
  });

  test('title stays editable after a submitted attempt exists', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
      submittedAt: new Date(),
      durationMs: 1000,
      status: 'submitted',
    });

    const res = await auth(request(app).patch(`/api/admin/daily-quizzes/${quiz.id}`)).send({ title: 'Renamed' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Renamed');
  });

  test('deleting a quiz removes its attempts', async () => {
    const quiz = await createQuiz();
    const student = await createStudent();
    await DailyQuizAttempt.create({
      quiz: quiz._id,
      quizDate: quiz.date,
      student: student._id,
      startedAt: new Date(),
    });

    const res = await auth(request(app).delete(`/api/admin/daily-quizzes/${quiz.id}`));
    expect(res.status).toBe(200);
    expect(await DailyQuiz.countDocuments()).toBe(0);
    expect(await DailyQuizAttempt.countDocuments()).toBe(0);
  });

  test('results list submitted attempts with student details, ranked', async () => {
    const quiz = await createQuiz();
    const fast = await createStudent({ fullName: 'Fast One' });
    const slow = await createStudent({ fullName: 'Slow One' });
    const base = { quiz: quiz._id, quizDate: quiz.date, status: 'submitted', submittedAt: new Date(), maxScore: 5 };
    await DailyQuizAttempt.create({ ...base, student: slow._id, startedAt: new Date(), score: 5, durationMs: 90000 });
    await DailyQuizAttempt.create({ ...base, student: fast._id, startedAt: new Date(), score: 5, durationMs: 30000 });

    const res = await auth(request(app).get(`/api/admin/daily-quizzes/${quiz.id}/results`));
    expect(res.status).toBe(200);
    expect(res.body.data.map((r) => r.fullName)).toEqual(['Fast One', 'Slow One']);
    expect(res.body.data[0]).toMatchObject({ score: 5, maxScore: 5, durationMs: 30000 });
    expect(res.body.data[0].studentId).toEqual(expect.any(String));
    expect(res.body.meta.total).toBe(2);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `cd sahlearn-api && npx jest tests/integration/adminDailyQuizzes.test.js`
Expected: FAIL — 404 `Route not found` on everything except the 401 test.

- [ ] **Step 3: Write the controller**

Create `sahlearn-api/src/controllers/admin.dailyQuizzes.controller.js`:

```js
// sahlearn-api/src/controllers/admin.dailyQuizzes.controller.js
const mongoose = require('mongoose');
const DailyQuiz = require('../models/DailyQuiz');
const DailyQuizAttempt = require('../models/DailyQuizAttempt');
const { lagosDateKey } = require('../utils/dateKey');
const { success, successList } = require('../utils/apiResponse');

const badId = (res) => res.status(400).json({ status: 'error', message: 'Invalid quiz id' });
const missing = (res) => res.status(404).json({ status: 'error', message: 'Quiz not found' });

const listQuizzes = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);

  const [total, quizzes] = await Promise.all([
    DailyQuiz.countDocuments(),
    DailyQuiz.find().sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  const counts = await DailyQuizAttempt.aggregate([
    { $match: { quiz: { $in: quizzes.map((q) => q._id) }, status: 'submitted' } },
    { $group: { _id: '$quiz', count: { $sum: 1 } } },
  ]);
  const countByQuiz = new Map(counts.map((c) => [String(c._id), c.count]));

  successList(
    res,
    quizzes.map((q) => ({
      id: q._id,
      date: q.date,
      title: q.title,
      questionCount: q.questions.length,
      totalPoints: q.totalPoints,
      isPublished: q.isPublished,
      attemptCount: countByQuiz.get(String(q._id)) || 0,
    })),
    { page, limit, total, totalPages: Math.ceil(total / limit) }
  );
};

const createQuiz = async (req, res) => {
  const date = req.body.date || lagosDateKey();

  if (await DailyQuiz.exists({ date })) {
    return res.status(409).json({ status: 'error', message: `A quiz already exists for ${date}.` });
  }

  const quiz = await DailyQuiz.create({
    date,
    title: req.body.title,
    description: req.body.description,
    questions: req.body.questions,
    isPublished: !!req.body.isPublished,
    publishedAt: req.body.isPublished ? new Date() : undefined,
  });

  success(res, quiz, 201);
};

const getQuiz = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const quiz = await DailyQuiz.findById(req.params.id);
  if (!quiz) return missing(res);
  success(res, quiz);
};

const updateQuiz = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const quiz = await DailyQuiz.findById(req.params.id);
  if (!quiz) return missing(res);

  if (req.body.questions) {
    // Rewriting questions after anyone has been scored would invalidate their
    // recorded score, so it is refused rather than silently accepted.
    const hasAttempts = await DailyQuizAttempt.exists({ quiz: quiz._id, status: 'submitted' });
    if (hasAttempts) {
      return res.status(409).json({
        status: 'error',
        message: 'Students have already taken this quiz, so its questions can no longer be changed.',
      });
    }
    quiz.questions = req.body.questions;
  }

  if (req.body.title !== undefined) quiz.title = req.body.title;
  if (req.body.description !== undefined) quiz.description = req.body.description;
  if (req.body.isPublished !== undefined) {
    quiz.isPublished = req.body.isPublished;
    if (req.body.isPublished && !quiz.publishedAt) quiz.publishedAt = new Date();
  }

  await quiz.save();
  success(res, quiz);
};

const deleteQuiz = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const quiz = await DailyQuiz.findById(req.params.id);
  if (!quiz) return missing(res);

  await DailyQuizAttempt.deleteMany({ quiz: quiz._id });
  await quiz.deleteOne();
  success(res, { deleted: true });
};

const getResults = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const quiz = await DailyQuiz.findById(req.params.id).select('_id').lean();
  if (!quiz) return missing(res);

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 50);
  const filter = { quiz: quiz._id, status: 'submitted' };

  const [total, attempts] = await Promise.all([
    DailyQuizAttempt.countDocuments(filter),
    DailyQuizAttempt.find(filter)
      .sort({ score: -1, durationMs: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student', 'fullName studentId')
      .lean(),
  ]);

  successList(
    res,
    attempts.map((a, i) => ({
      id: a._id,
      rank: (page - 1) * limit + i + 1,
      fullName: a.student?.fullName || '—',
      studentId: a.student?.studentId || '—',
      score: a.score,
      maxScore: a.maxScore,
      durationMs: a.durationMs,
      submittedAt: a.submittedAt,
    })),
    { page, limit, total, totalPages: Math.ceil(total / limit) }
  );
};

module.exports = { listQuizzes, createQuiz, getQuiz, updateQuiz, deleteQuiz, getResults };
```

- [ ] **Step 4: Write the router and mount it**

Create `sahlearn-api/src/routes/admin.dailyQuizzes.routes.js`:

```js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const {
  listQuizzes,
  createQuiz,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  getResults,
} = require('../controllers/admin.dailyQuizzes.controller');

router.use(authMiddleware);

const questionsValidator = body('questions')
  .isArray({ min: 5, max: 10 })
  .withMessage('A daily quiz needs between 5 and 10 questions');

router.get('/', listQuizzes);
router.post(
  '/',
  [
    body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('isPublished').optional().isBoolean(),
    questionsValidator,
  ],
  validate,
  createQuiz
);
router.get('/:id', getQuiz);
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 2000 }),
    body('isPublished').optional().isBoolean(),
    body('questions').optional().isArray({ min: 5, max: 10 })
      .withMessage('A daily quiz needs between 5 and 10 questions'),
  ],
  validate,
  updateQuiz
);
router.delete('/:id', deleteQuiz);
router.get('/:id/results', getResults);

module.exports = router;
```

In `sahlearn-api/src/app.js`, require it and mount it **above `app.use('/api/admin', adminRoutes)`**:

```js
const adminDailyQuizzesRoutes = require('./routes/admin.dailyQuizzes.routes');
```

```js
app.use('/api/admin/daily-quizzes', adminDailyQuizzesRoutes);
```

- [ ] **Step 5: Run it and watch it pass**

Run: `cd sahlearn-api && npx jest tests/integration/adminDailyQuizzes.test.js`
Expected: PASS, 15 tests.

- [ ] **Step 6: Run the whole API suite**

Run: `cd sahlearn-api && npm test`
Expected: PASS, all suites.

- [ ] **Step 7: Commit**

```bash
git add sahlearn-api/src/controllers/admin.dailyQuizzes.controller.js sahlearn-api/src/routes/admin.dailyQuizzes.routes.js sahlearn-api/src/app.js sahlearn-api/tests/integration/adminDailyQuizzes.test.js
git commit -m "feat(api): add admin daily quiz CRUD and results

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 10: Rate limiting verified end-to-end

The limiters are wired but skipped in tests. This task proves they fire.

**Files:**
- Test: `sahlearn-api/tests/integration/dailyQuiz.rateLimit.test.js`

**Interfaces:**
- Consumes: the limiters from Task 4 and the `TEST_RATE_LIMIT` escape hatch from Task 1.
- Produces: nothing new.

- [ ] **Step 1: Write the test**

Create `sahlearn-api/tests/integration/dailyQuiz.rateLimit.test.js`:

```js
// This file opts into real rate limiting. It must set the flag and require the
// app *after*, because the limiters capture the flag when app.js is loaded.
process.env.TEST_RATE_LIMIT = '1';

const request = require('supertest');
const app = require('../../src/app');
const { createQuiz } = require('../factories');

afterAll(() => {
  delete process.env.TEST_RATE_LIMIT;
});

describe('daily quiz rate limits', () => {
  test('the 11th start in an hour is refused with 429', async () => {
    await createQuiz();
    let last;
    for (let i = 0; i < 11; i += 1) {
      last = await request(app).post('/api/daily-quiz/start').send({ studentId: 'SAH/does-not-exist' });
    }
    expect(last.status).toBe(429);
    expect(last.body.status).toBe('error');
    expect(last.body.message).toMatch(/too many/i);
  });
});
```

If this file runs in the same jest process as the others and the flag leaks, jest's module registry is the culprit — run it in its own process by adding `--runInBand` (already set) and keeping the flag assignment at the very top of the file, above every `require`.

- [ ] **Step 2: Run it**

Run: `cd sahlearn-api && npx jest tests/integration/dailyQuiz.rateLimit.test.js`
Expected: PASS, 1 test.

- [ ] **Step 3: Run the whole suite to confirm no leakage**

Run: `cd sahlearn-api && npm test`
Expected: PASS, every suite. If other suites now return 429, the flag is leaking — move this test to its own jest project or set `resetModules` for the file.

- [ ] **Step 4: Commit**

```bash
git add sahlearn-api/tests/integration/dailyQuiz.rateLimit.test.js
git commit -m "test(api): verify daily quiz rate limits return 429

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 11: Frontend services

**Files:**
- Create: `sahlearn-web/src/services/dailyQuiz.service.js`
- Create: `sahlearn-web/src/services/adminDailyQuizzes.service.js`

**Interfaces:**
- Consumes: `src/services/api.js`.
- Produces:
  - Public/student: `getTodayQuiz()`, `startQuiz(studentId)`, `submitQuiz(attemptToken, answers)`, `getLeaderboard(date?)`, `getMyQuizHistory({ page, limit })`
  - Admin: `listDailyQuizzes({ page, limit })`, `createDailyQuiz(payload)`, `getDailyQuiz(id)`, `updateDailyQuiz(id, payload)`, `deleteDailyQuiz(id)`, `getDailyQuizResults(id, { page, limit })`
  - Shared helper `formatDuration(ms) => string` exported from `dailyQuiz.service.js`, e.g. `185000` → `'3m 05s'`.

There are no frontend tests in this repo, so each frontend task ends with explicit browser verification steps instead of a test run.

- [ ] **Step 1: Write the public/student service**

Create `sahlearn-web/src/services/dailyQuiz.service.js`:

```js
import api from './api';

const studentHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

export const getTodayQuiz = () =>
  api.get('/api/daily-quiz/today').then((r) => r.data.data);

export const startQuiz = (studentId) =>
  api.post('/api/daily-quiz/start', { studentId }).then((r) => r.data.data);

export const submitQuiz = (attemptToken, answers) =>
  api.post('/api/daily-quiz/submit', { attemptToken, answers }).then((r) => r.data.data);

export const getLeaderboard = (date) =>
  api.get('/api/daily-quiz/leaderboard', { params: date ? { date } : {} }).then((r) => r.data.data);

export const getMyQuizHistory = ({ page = 1, limit = 20 } = {}) =>
  api
    .get('/api/student/daily-quiz/history', { params: { page, limit }, headers: studentHeader() })
    .then((r) => ({ data: r.data.data, meta: r.data.meta, stats: r.data.stats }));

export const formatDuration = (ms) => {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
};
```

- [ ] **Step 2: Write the admin service**

Create `sahlearn-web/src/services/adminDailyQuizzes.service.js`:

```js
import api from './api';

const adminHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_token')}`,
});

export const listDailyQuizzes = ({ page = 1, limit = 20 } = {}) =>
  api
    .get('/api/admin/daily-quizzes', { params: { page, limit }, headers: adminHeader() })
    .then((r) => ({ data: r.data.data, meta: r.data.meta }));

export const createDailyQuiz = (payload) =>
  api.post('/api/admin/daily-quizzes', payload, { headers: adminHeader() }).then((r) => r.data.data);

export const getDailyQuiz = (id) =>
  api.get(`/api/admin/daily-quizzes/${id}`, { headers: adminHeader() }).then((r) => r.data.data);

export const updateDailyQuiz = (id, payload) =>
  api.patch(`/api/admin/daily-quizzes/${id}`, payload, { headers: adminHeader() }).then((r) => r.data.data);

export const deleteDailyQuiz = (id) =>
  api.delete(`/api/admin/daily-quizzes/${id}`, { headers: adminHeader() });

export const getDailyQuizResults = (id, { page = 1, limit = 50 } = {}) =>
  api
    .get(`/api/admin/daily-quizzes/${id}/results`, { params: { page, limit }, headers: adminHeader() })
    .then((r) => ({ data: r.data.data, meta: r.data.meta }));
```

- [ ] **Step 3: Verify the build still compiles**

Run: `cd sahlearn-web && npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add sahlearn-web/src/services/dailyQuiz.service.js sahlearn-web/src/services/adminDailyQuizzes.service.js
git commit -m "feat(web): add daily quiz API services

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 12: Admin MCQ question editor component

The spec says the exam question editor is reused. `QuestionEditor` is defined **inside** `sahlearn-web/src/pages/admin/ExamForm.jsx` and is not exported, and it supports a `short` type the daily quiz must not offer. Extracting it would touch the working exam flow for no benefit, so this task creates a narrowed, MCQ-only sibling modelled on it. `ExamForm.jsx` is not modified.

**Files:**
- Create: `sahlearn-web/src/components/admin/McqQuestionEditor.jsx`

**Interfaces:**
- Produces: default export `McqQuestionEditor({ question, index, onChange, onRemove })` where `question` is `{ text, options: string[], correctIndex: number | null, points: number }`, plus a named export `emptyMcqQuestion()` returning `{ text: '', options: ['', '', '', ''], correctIndex: null, points: 1 }`.

- [ ] **Step 1: Read the component being adapted**

Open `sahlearn-web/src/pages/admin/ExamForm.jsx` and read the `QuestionEditor` function and `emptyQuestion` helper at the top. Match its Tailwind classes, spacing and lucide icons so the two editors look like the same product.

- [ ] **Step 2: Write the component**

Create `sahlearn-web/src/components/admin/McqQuestionEditor.jsx`. Mirror `QuestionEditor`'s markup and classes, with these differences:

- No question-type `<select>`. Every question is MCQ.
- The options block is always rendered, never behind a `question.type === 'mcq'` check.
- Keep: the collapsible header showing `Q{index + 1}` and the question text, the text `<textarea>`, the points `<input type="number" min="1">`, the radio-per-option "mark correct" control, per-option remove buttons (disabled at 2 options), and the "Add option" button (hidden at 4 options).
- Keep the existing guard: removing an option clamps `correctIndex` with `Math.min(question.correctIndex, opts.length - 1)`.
- `onRemove` renders a remove-question button in the header.

Also export the helper:

```js
export const emptyMcqQuestion = () => ({
  text: '',
  options: ['', '', '', ''],
  correctIndex: null,
  points: 1,
});
```

- [ ] **Step 3: Verify it compiles**

Run: `cd sahlearn-web && npm run lint && npm run build`
Expected: both succeed. The component is not yet imported anywhere, so nothing renders — that is expected.

- [ ] **Step 4: Commit**

```bash
git add sahlearn-web/src/components/admin/McqQuestionEditor.jsx
git commit -m "feat(web): add MCQ-only question editor for daily quizzes

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 13: Admin daily quiz pages

**Files:**
- Create: `sahlearn-web/src/pages/admin/DailyQuizzes.jsx`
- Create: `sahlearn-web/src/pages/admin/DailyQuizForm.jsx`
- Create: `sahlearn-web/src/pages/admin/DailyQuizResults.jsx`
- Modify: `sahlearn-web/src/routes/AppRouter.jsx`
- Modify: `sahlearn-web/src/components/layout/AdminLayout.jsx`

**Interfaces:**
- Consumes: `adminDailyQuizzes.service.js` (Task 11), `McqQuestionEditor` + `emptyMcqQuestion` (Task 12), `formatDuration` (Task 11).
- Produces: routes `/admin/daily-quizzes`, `/admin/daily-quizzes/new`, `/admin/daily-quizzes/:id/edit`, `/admin/daily-quizzes/:id/results`.

- [ ] **Step 1: Build the list page**

Create `sahlearn-web/src/pages/admin/DailyQuizzes.jsx`, following the structure of `sahlearn-web/src/pages/admin/Exams.jsx`:

- One `<h1>`: "Daily Quizzes".
- A "New quiz" button linking to `/admin/daily-quizzes/new`.
- Table columns: Date, Title, Questions, Status (published / draft badge — reuse `components/common/StatusBadge.jsx`), Attempts, Actions.
- Actions per row: Edit (`/admin/daily-quizzes/:id/edit`), Results (`/admin/daily-quizzes/:id/results`), Delete (confirm via `components/common/Modal.jsx`, then `deleteDailyQuiz`, then refetch).
- Loading state: the existing spinner pattern. Empty state: `components/common/EmptyState.jsx` with "No quizzes yet — create today's."
- Pagination via `components/common/Pagination.jsx` driven by `meta`.
- `react-hot-toast` for success and failure messages.

- [ ] **Step 2: Build the create/edit form**

Create `sahlearn-web/src/pages/admin/DailyQuizForm.jsx`, following `sahlearn-web/src/pages/admin/ExamForm.jsx`:

- Serves both `/new` and `/:id/edit`, branching on `useParams().id`.
- Fields: Date (`<input type="date">`, defaulting to today, disabled when editing), Title, Description, a Published toggle, and the question list rendered with `McqQuestionEditor`.
- "Add question" button, disabled at 10 questions. Question remove buttons, disabled at 5 questions.
- Before submitting, block and `toast.error` when: fewer than 5 questions, any question with blank text, any question with a blank option, or any question whose `correctIndex` is `null` ("Mark the correct answer for Q3").
- On edit, if the PATCH returns 409, show the server's `message` as a toast — that is the "students have already taken this quiz" case — and leave the form populated.
- On success, `toast.success` and navigate to `/admin/daily-quizzes`.

- [ ] **Step 3: Build the results page**

Create `sahlearn-web/src/pages/admin/DailyQuizResults.jsx`:

- One `<h1>` with the quiz title and date.
- Table columns: Rank, Name, Student ID, Score (`score / maxScore`), Time (`formatDuration(durationMs)`), Submitted at.
- Empty state: "Nobody has taken this quiz yet."
- Pagination from `meta`.

- [ ] **Step 4: Register the routes**

In `sahlearn-web/src/routes/AppRouter.jsx`, add the lazy imports beside the other admin ones:

```js
const AdminDailyQuizzes = lazy(() => import('../pages/admin/DailyQuizzes'));
const AdminDailyQuizForm = lazy(() => import('../pages/admin/DailyQuizForm'));
const AdminDailyQuizResults = lazy(() => import('../pages/admin/DailyQuizResults'));
```

and the routes inside the `/admin` protected block, next to the `exams` routes:

```jsx
<Route path="daily-quizzes" element={<AdminDailyQuizzes />} />
<Route path="daily-quizzes/new" element={<AdminDailyQuizForm />} />
<Route path="daily-quizzes/:id/edit" element={<AdminDailyQuizForm />} />
<Route path="daily-quizzes/:id/results" element={<AdminDailyQuizResults />} />
```

- [ ] **Step 5: Add the nav entry**

In `sahlearn-web/src/components/layout/AdminLayout.jsx`, add to **both** nav arrays (the sidebar list around line 16 and the "more" list around line 35), directly after the Exams entry:

```js
{ to: '/admin/daily-quizzes', label: 'Daily Quiz', icon: CalendarClock },
```

Add `CalendarClock` to the existing `lucide-react` import.

- [ ] **Step 6: Verify in the browser**

Start both apps (`cd sahlearn-api && npm run dev`, `cd sahlearn-web && npm run dev`), log in at `/admin/login`, then:

1. Open `/admin/daily-quizzes` → empty state renders, "Daily Quiz" is in the sidebar.
2. Create a quiz with 5 questions, leaving one `correctIndex` unset → submitting is blocked with a toast naming the question.
3. Mark every answer, publish, save → redirected to the list, the row shows today's date and a Published badge.
4. Edit it and change the title → saves.
5. Open Results → "Nobody has taken this quiz yet."
6. Try to create a second quiz for the same date → toast shows the 409 message.

- [ ] **Step 7: Commit**

```bash
git add sahlearn-web/src/pages/admin/DailyQuizzes.jsx sahlearn-web/src/pages/admin/DailyQuizForm.jsx sahlearn-web/src/pages/admin/DailyQuizResults.jsx sahlearn-web/src/routes/AppRouter.jsx sahlearn-web/src/components/layout/AdminLayout.jsx
git commit -m "feat(web): add admin daily quiz pages

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 14: Public quiz page

**Files:**
- Create: `sahlearn-web/src/pages/public/DailyQuiz.jsx`
- Create: `sahlearn-web/src/components/quiz/QuizIdForm.jsx`
- Create: `sahlearn-web/src/components/quiz/QuizQuestion.jsx`
- Create: `sahlearn-web/src/components/quiz/QuizResult.jsx`
- Create: `sahlearn-web/src/components/quiz/QuizLeaderboard.jsx`
- Modify: `sahlearn-web/src/routes/AppRouter.jsx`
- Modify: `sahlearn-web/src/components/layout/Navbar.jsx`

**Interfaces:**
- Consumes: `dailyQuiz.service.js` (Task 11), `components/common/SEO.jsx`.
- Produces: public route `/quiz`.

- [ ] **Step 1: Build the page shell and its states**

Create `sahlearn-web/src/pages/public/DailyQuiz.jsx`. It owns one `phase` state machine: `loading → unavailable | idle → taking → done`.

- On mount, call `getTodayQuiz()`.
  - `available: false` → `unavailable`: a centred card, "No quiz today. Check back tomorrow." plus the leaderboard for today.
  - `available: true` → `idle`: title, description, question count, total points, and `QuizIdForm`.
- `<SEO title="Daily Quiz" description="Take today's Sahlearn daily quiz. Five to ten quick questions, instant score." url="/quiz" />`, and exactly one `<h1>`.
- Keep the `attemptToken` in component state only. Do not put it in `localStorage` — it is a credential, and the attempt is resumable from the student ID anyway.

- [ ] **Step 2: Build the ID form**

Create `sahlearn-web/src/components/quiz/QuizIdForm.jsx`:

- A single labelled text input ("Student ID") and a submit button.
- Disable the button and show a spinner while the request is in flight.
- On error, render the server's `message` inline beneath the input, in red, with `role="alert"`.
- Handle the 409 specially: the response carries `error.response.data.data` with `{ score, maxScore, durationMs, submittedAt }`. Lift that to the parent so it can jump straight to the `done` phase showing the earlier result, rather than showing an error.

- [ ] **Step 3: Build the question view**

Create `sahlearn-web/src/components/quiz/QuizQuestion.jsx`:

- Props: `{ question, index, total, selectedIndex, onSelect }`.
- Renders "Question {index + 1} of {total}", the question text, and the options as large tappable radio cards (mobile-first: full width, stacked; `sm:` and up can stay stacked — these are answer choices, not a grid).
- The selected option gets the brand border and background. Every option is a real `<input type="radio">` visually hidden behind a `<label>`, so keyboard and screen-reader users can answer.

In the parent, drive one question at a time with Back / Next buttons and a progress bar. The last question shows Submit instead of Next. A display-only stopwatch, started from the `startedAt` the server returned, sits in the header — label it plainly ("Time: 1m 12s"). It never blocks submission; the server is the source of truth for the recorded time.

- [ ] **Step 4: Build the result view**

Create `sahlearn-web/src/components/quiz/QuizResult.jsx`:

- Props: `{ result, questions }` where `result` is the submit payload.
- Big score ("8 / 10"), time taken via `formatDuration`, then a per-question review listing each question with the student's choice and the correct one, green for correct and red for wrong.
- When the result came from the 409 path there are no `results` or `questions` — render the score and time only, with the note "You took today's quiz already."
- A link to `/student/login`: "Log in to see your full quiz history."
- Renders `QuizLeaderboard` beneath.

- [ ] **Step 5: Build the leaderboard**

Create `sahlearn-web/src/components/quiz/QuizLeaderboard.jsx`:

- Props: `{ date }`. Fetches on mount via `getLeaderboard(date)`.
- Heading "Today's top scores", then rows of rank, name, score, time.
- Empty state: "Nobody has finished yet today. Be first."
- On a failed fetch, render nothing rather than an error — the leaderboard is secondary to the quiz.

- [ ] **Step 6: Register the route and the nav link**

In `sahlearn-web/src/routes/AppRouter.jsx`:

```js
const DailyQuizPage = lazy(() => import('../pages/public/DailyQuiz'));
```

Inside the `PublicLayout` block, **above** the `path="*"` catch-all:

```jsx
<Route path="/quiz" element={<DailyQuizPage />} />
```

In `sahlearn-web/src/components/layout/Navbar.jsx`, add to the nav array (around line 6), after Courses:

```js
{ to: '/quiz', label: 'Daily Quiz' },
```

- [ ] **Step 7: Verify in the browser**

With a published quiz for today and a known student ID:

1. Open `/quiz` logged out in a private window → title, description and the ID field render. "Daily Quiz" appears in the navbar.
2. Enter a wrong ID → inline error, no navigation.
3. Enter a valid ID → questions appear, the stopwatch runs, the progress bar advances.
4. Open DevTools → confirm no response contains `correctIndex` before submit.
5. Refresh mid-quiz and re-enter the same ID → the quiz resumes and the stopwatch continues from the original start, not from zero.
6. Answer some correctly, some not, and submit → score, time, per-question review and leaderboard all render.
7. Enter the same ID again → the earlier result shows, not a fresh quiz.
8. Check the page at 375px wide → no horizontal scroll, options are tappable.

- [ ] **Step 8: Commit**

```bash
git add sahlearn-web/src/pages/public/DailyQuiz.jsx sahlearn-web/src/components/quiz sahlearn-web/src/routes/AppRouter.jsx sahlearn-web/src/components/layout/Navbar.jsx
git commit -m "feat(web): add public daily quiz page

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 15: Student dashboard history

**Files:**
- Create: `sahlearn-web/src/pages/student/DailyQuizHistory.jsx`
- Modify: `sahlearn-web/src/routes/AppRouter.jsx`
- Modify: `sahlearn-web/src/components/layout/StudentLayout.jsx`
- Modify: `sahlearn-web/src/pages/student/Dashboard.jsx`

**Interfaces:**
- Consumes: `getMyQuizHistory`, `formatDuration` (Task 11).
- Produces: route `/student/daily-quiz`.

- [ ] **Step 1: Build the history page**

Create `sahlearn-web/src/pages/student/DailyQuizHistory.jsx`, following `sahlearn-web/src/pages/student/Attendance.jsx`:

- One `<h1>`: "Daily Quiz".
- A stat row of four cards from `stats`: Quizzes taken, Average score, Best score, Current streak (suffix "days").
- A table: Date, Quiz, Score (`score / maxScore`), Time (`formatDuration`).
- Empty state: "You have not taken a daily quiz yet." with a link to `/quiz`.
- Pagination from `meta`.
- A "Take today's quiz" button linking to `/quiz`.

- [ ] **Step 2: Register the route**

In `sahlearn-web/src/routes/AppRouter.jsx`:

```js
const StudentDailyQuiz = lazy(() => import('../pages/student/DailyQuizHistory'));
```

Inside the `/student` protected block:

```jsx
<Route path="daily-quiz" element={<StudentDailyQuiz />} />
```

- [ ] **Step 3: Add the nav entry**

In `sahlearn-web/src/components/layout/StudentLayout.jsx`, add to **both** nav arrays (the sidebar list around line 14 and the "more" list around line 35), after the Exams entry:

```js
{ to: '/student/daily-quiz', label: 'Daily Quiz', icon: CalendarClock },
```

Add `CalendarClock` to the `lucide-react` import.

- [ ] **Step 4: Add the dashboard card**

In `sahlearn-web/src/pages/student/Dashboard.jsx`, add one card matching the existing cards' markup: heading "Daily Quiz", the current streak and best score from `getMyQuizHistory({ limit: 1 })`, and a link to `/student/daily-quiz`. If the call fails, render the card with dashes rather than breaking the dashboard.

- [ ] **Step 5: Verify in the browser**

1. Log in at `/student/login` as the student who took the quiz in Task 14.
2. "Daily Quiz" appears in the student sidebar.
3. `/student/daily-quiz` shows today's attempt with the correct score and time, and `Current streak` reads 1.
4. The dashboard card shows the same numbers and links through.
5. Log in as a student who has never played → empty state with the `/quiz` link, all stats zero.
6. Check at 375px wide → the stat cards stack, the table scrolls rather than overflowing the page.

- [ ] **Step 6: Commit**

```bash
git add sahlearn-web/src/pages/student/DailyQuizHistory.jsx sahlearn-web/src/routes/AppRouter.jsx sahlearn-web/src/components/layout/StudentLayout.jsx sahlearn-web/src/pages/student/Dashboard.jsx
git commit -m "feat(web): add student daily quiz history and dashboard card

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 16: Sitemap, robots and a full-stack pass

**Files:**
- Modify: `sahlearn-api/src/app.js` (sitemap static URL list)
- Verify: `sahlearn-web/public/robots.txt`

**Interfaces:**
- Consumes: everything above.
- Produces: `/quiz` in `sitemap.xml`.

- [ ] **Step 1: Add `/quiz` to the sitemap**

In `sahlearn-api/src/app.js`, in the `/sitemap.xml` handler, extend the static URL list:

```js
const staticUrls = ['', '/about', '/courses', '/blog', '/contact', '/quiz'].map((path) => `
```

- [ ] **Step 2: Confirm robots.txt**

Open `sahlearn-web/public/robots.txt`. It must allow `/quiz` and continue to disallow `/admin/`. If `/quiz` is already allowed by a blanket `Allow: /`, change nothing.

- [ ] **Step 3: Run the full API suite**

Run: `cd sahlearn-api && npm test`
Expected: PASS, every suite, no skipped tests.

- [ ] **Step 4: Build the frontend**

Run: `cd sahlearn-web && npm run lint && npm run build`
Expected: both succeed with no new warnings.

- [ ] **Step 5: Walk the whole feature once**

With both dev servers running:

1. As admin, create and publish a quiz for today.
2. Log out. Open `/quiz` in a private window and take the quiz as Student A.
3. Take it as Student B with a different score.
4. Confirm the leaderboard orders them correctly, and that a tie on score puts the faster time first.
5. Log in as Student A → `/student/daily-quiz` shows the attempt.
6. As admin, open the quiz's Results page → both students listed, ranked, with times.
7. As admin, try to edit the quiz's questions → refused with the 409 message.
8. As admin, unpublish the quiz → `/quiz` shows "No quiz today", and the leaderboard empties.
9. Visit `/sitemap.xml` → `/quiz` is listed.

- [ ] **Step 6: Commit**

```bash
git add sahlearn-api/src/app.js
git commit -m "feat(api): list /quiz in sitemap.xml

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```
