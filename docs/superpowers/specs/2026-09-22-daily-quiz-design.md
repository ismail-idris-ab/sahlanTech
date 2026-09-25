# Daily Public Quiz — Design

Date: 2026-09-22
Status: Approved (design), pending implementation plan

## 1. Intent

Give Sahlearn a daily quiz that any student can take from a public page by
entering their student ID. The admin authors one quiz per day from the
dashboard. Scores and completion times are recorded automatically and appear
in the student's dashboard, plus a public daily leaderboard.

Goals:
- Build a daily habit for students and give the brand a public, repeat-visit page.
- Zero grading work for the admin — every question is auto-scored.
- Recorded scores and times are trustworthy against casual tampering.

Success criteria:
- Admin can publish a quiz in under five minutes a day.
- A student can go from the public page to a scored result without logging in.
- Score, time taken, and history appear correctly in the student dashboard.

## 2. Decisions taken

| Question | Decision |
|---|---|
| Student identification | Student ID only, no password |
| Availability | Published manually by admin; live until 23:59 Africa/Lagos on its date |
| Timer | Recorded, not enforced. No time limit |
| After submit | Score, time, correct answers revealed, plus public leaderboard |
| Scope | One general quiz per day for all students. Not per-course |
| Question format | MCQ only, 1–10 questions per quiz |

### Accepted risk: ID-only access

A student ID is a short, printed, guessable bearer credential. Anyone who knows
or guesses an ID can take the quiz as that student and write a score to their
dashboard and to the public leaderboard. This was raised and accepted by the
project owner.

Mitigations built into this design:
- Every attempt stores `verified: false`. A future move to password-backed
  access sets it `true` with no migration, and the leaderboard can be filtered
  to verified attempts by changing one query.
- The lookup endpoint is rate limited per IP and returns a generic error for
  unknown and inactive IDs alike, to blunt ID enumeration.
- Attempts store a hashed IP for after-the-fact abuse review.

## 3. Data model

Two new Mongoose models in `sahlearn-api/src/models/`.

### `DailyQuiz`

```
date          String  'YYYY-MM-DD' in Africa/Lagos   — required, unique index
title         String  required, max 200
description   String  max 2000
questions     [questionSchema]                        — 1..10 entries
totalPoints   Number  computed pre-save
isPublished   Boolean default false                   — indexed
publishedAt   Date
timestamps
```

`questionSchema` (MCQ only — no `type` discriminator, unlike `Exam`):

```
text          String  required, max 1000
options       [String] 2..4 entries, each required and non-empty
correctIndex  Number  required, 0 <= correctIndex < options.length
points        Number  default 1, min 1
```

Validation: `questions.length` between 1 and 10 on save (relaxed from 5 on 2026-09-23 at the owner's request).

### `DailyQuizAttempt`

```
quiz          ObjectId ref DailyQuiz   required
quizDate      String                   required   — denormalized from quiz.date
student       ObjectId ref Student     required
answers       [{ questionIndex: Number, selectedIndex: Number }]
score         Number default 0
maxScore      Number default 0
startedAt     Date    required   — server stamped
submittedAt   Date               — server stamped
durationMs    Number             — submittedAt - startedAt, server computed
status        String enum ['in_progress','submitted'] default 'in_progress'
verified      Boolean default false
ipHash        String             — sha256(ip + JWT_SECRET), see note below
timestamps
```

Indexes:
- `{ quizDate: 1, student: 1 }` unique — one attempt per student per day.
- `{ quizDate: 1, score: -1, durationMs: 1 }` — leaderboard ordering.
- `{ student: 1, quizDate: -1 }` — dashboard history.

Both models use the project's standard `toJSON` transform (`id`, drop `_id`/`__v`).
`DailyQuizAttempt` additionally drops `ipHash` from its JSON output, so it never
reaches any client.

`ipHash` is salted with the existing `JWT_SECRET` rather than a new secret, so
CLAUDE.md §18 needs no new environment variable. The raw IP is never stored.

### Why not extend `Exam`

`Exam` is JWT-gated, enrollment-aware, admin-graded, and carries `dueDate` and
`enrollmentCutoff`. The daily quiz is public, ID-only, auto-scored, and one per
day. Sharing a collection would require an `isDaily` filter on every existing
exam query, and a single missed filter would leak a real exam through a public
endpoint. The models stay separate. The question editor React component and the
MCQ scoring logic are reused.

### Date handling

New `sahlearn-api/src/utils/dateKey.js`:

```js
function lagosDateKey(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}
```

The existing check-in controller uses `toISOString().slice(0,10)`, which rolls
the day over at 01:00 Lagos time. That is a pre-existing bug and is out of scope
here; the daily quiz uses `lagosDateKey` from the start.

## 4. API

Response envelopes follow CLAUDE.md §10 exactly.

### Public — no JWT

**`GET /api/daily-quiz/today`**
Returns metadata only. Never questions, never `correctIndex`.

```json
{ "status": "success", "data": { "available": true, "date": "2026-09-22",
  "title": "...", "description": "...", "questionCount": 8, "totalPoints": 8 } }
```

No published quiz for today → `data.available === false`, HTTP 200.

**`POST /api/daily-quiz/start`** body `{ "studentId": "..." }`

- Look up `Student` by `studentId`; must exist and be `isActive`. Otherwise 404
  with a generic message.
- No published quiz today → 404.
- Existing attempt with `status: 'submitted'` for today → **409** carrying that
  attempt's score, maxScore and durationMs, so the client can show the result.
- Existing `in_progress` attempt → return it unchanged, original `startedAt`
  preserved. Refreshing never resets the timer.
- Otherwise create the attempt and stamp `startedAt`.

Returns the questions with `correctIndex` stripped, plus `attemptToken` — a JWT
signed with the existing `JWT_SECRET`, payload `{ attemptId }`, 3 hour expiry.
The raw student ID travels over the wire exactly once.

**`POST /api/daily-quiz/submit`** body `{ "attemptToken": "...", "answers": [...] }`

- Verify the token; 401 on invalid or expired.
- Attempt already `submitted` → 409.
- Score server-side: sum `points` where `selectedIndex === correctIndex`.
  Unanswered or out-of-range indexes score zero.
- Stamp `submittedAt`, compute `durationMs` from the stored `startedAt`. Any
  client-supplied elapsed time is ignored.
- Set `status: 'submitted'`.

Returns `score`, `maxScore`, `durationMs`, and per-question
`{ selectedIndex, correctIndex, isCorrect }`.

**`GET /api/daily-quiz/leaderboard?date=YYYY-MM-DD`**
Defaults to today. Submitted attempts only, sorted by `score` desc then
`durationMs` asc, top 20. Each row: `rank`, `fullName`, `score`, `durationMs`.
No email, no student ID.

### Student — existing student JWT

**`GET /api/student/daily-quiz/history?page=&limit=`**
The caller's own submitted attempts, newest first, paginated with the standard
`meta` block, plus:

```json
"stats": { "totalTaken": 12, "averageScore": 6.4, "bestScore": 9, "currentStreak": 3 }
```

`currentStreak` counts consecutive Lagos dates ending today or yesterday.

### Admin — existing admin JWT, `role === 'admin'`

- `GET  /api/admin/daily-quizzes` — paginated list, newest date first.
- `POST /api/admin/daily-quizzes` — `date` defaults to today's Lagos key.
  Duplicate date → 409.
- `GET  /api/admin/daily-quizzes/:id` — full quiz including `correctIndex`.
- `PATCH /api/admin/daily-quizzes/:id` — editing `questions` is **blocked with
  409** once any submitted attempt exists, because it would invalidate recorded
  scores. `title`, `description` and `isPublished` stay editable.
- `DELETE /api/admin/daily-quizzes/:id` — cascades to its attempts.
- `GET /api/admin/daily-quizzes/:id/results` — paginated: student name,
  studentId, score, maxScore, durationMs, submittedAt.

### Rate limiting (CLAUDE.md §17)

| Endpoint | Limit |
|---|---|
| `POST /api/daily-quiz/start` | 10 / hour / IP |
| `POST /api/daily-quiz/submit` | 20 / hour / IP |
| `GET /api/daily-quiz/today` | 60 / 15 min / IP |
| `GET /api/daily-quiz/leaderboard` | 60 / 15 min / IP |

### Mounting

`/api/daily-quiz` and `/api/student/daily-quiz` are mounted **before** the
generic `/api/student` router in `app.js`, per the fix in commit 4fac369, so the
public routes do not inherit student auth middleware.

## 5. User flow

1. Visitor opens `/quiz`. The page calls `today` and shows the title plus a
   single "Enter your Student ID" field.
2. The student submits their ID. The client calls `start`. The server creates
   the attempt, stamps `startedAt`, and returns the questions.
3. The client renders one question at a time with a display-only stopwatch.
4. The student submits. The server scores the attempt and computes the elapsed
   time from its own timestamps.
5. The result screen shows score, time taken, a per-question review, the day's
   leaderboard, and a "Log in to see your full history" link.
6. In the student dashboard, a Daily Quiz section shows the history table and
   the stats block.

## 6. Error handling

Central error middleware, standard envelope, no stack traces in production.

| Case | Code |
|---|---|
| Unknown or inactive student ID | 404, generic message |
| No published quiz today | 404 on `start`, 200 with `available: false` on `today` |
| Already submitted today | 409, carrying the existing result |
| Invalid or expired `attemptToken` | 401 |
| Duplicate quiz date on create | 409 |
| Editing questions after attempts exist | 409 |
| Validation failure | 422 with the `errors` array |
| Rate limit hit | 429 with a friendly message |

Frontend: inline errors on the ID field, a page-level state for "no quiz today",
and a toast for transient network failures.

## 7. Frontend

Paths follow the existing `sahlearn-web/src` layout.

- `pages/public/DailyQuiz.jsx` — route `/quiz`, public, in the main layout.
- `components/quiz/QuizIdForm.jsx`, `QuizQuestion.jsx`, `QuizResult.jsx`,
  `QuizLeaderboard.jsx`
- `pages/student/DailyQuizHistory.jsx` plus a stat card on the student dashboard.
- `pages/admin/DailyQuizzes.jsx`, `DailyQuizEditor.jsx` (reuses the existing exam
  question editor), `DailyQuizResults.jsx`
- `services/dailyQuiz.service.js` and `services/adminDailyQuizzes.service.js` —
  every API call lives here; components never call axios directly.

SEO per CLAUDE.md §14: the public quiz page gets its own title, meta
description, canonical URL and a single `<h1>`.

## 8. Testing

- Scoring math, including unanswered and out-of-range `selectedIndex`.
- Duplicate attempt for the same student and date returns 409 with the result.
- `correctIndex` never appears in the `start` or `today` response payloads.
- `durationMs` is computed from server timestamps even when the client sends a
  forged elapsed time.
- `lagosDateKey` returns the correct date either side of UTC midnight.
- An unpublished quiz is invisible on every public endpoint.
- Rate limits return 429.
- Editing questions after a submitted attempt returns 409.

## 9. Out of scope for this build

These are deliberately excluded and require a separate request:

- A "duplicate yesterday's quiz" shortcut for the admin. Recommended, but not
  approved for this build.
- A cleanup job for abandoned `in_progress` attempts. They simply stay out of the
  leaderboard and history.
- Per-course quizzes, scheduled auto-publish, enforced time limits, and
  time-weighted scoring. All four were considered and rejected.
- Migrating the existing daily check-in to `lagosDateKey`.

---

## Addendum — essay questions (2026-09-23)

Added at the owner's request, after the MCQ-only build shipped.

**Question types.** `DailyQuiz.questions[].type` is `'mcq'` or `'essay'`,
defaulting to `'mcq'` so existing quizzes read back unchanged with no
migration. An essay carries no `options` and no `correctIndex` — both are
stripped in a pre-validate hook so nothing downstream can mistake one for
auto-scorable.

**Scoring becomes progressive.** `DailyQuizAttempt.score` now means "points
awarded so far". MCQ points land at submit; each essay adds to the total when
the admin marks it. `maxScore` always counts every question. New fields:
`answers[].text`, `answers[].awardedPoints`, `answers[].graded`, and
`pendingEssays` on the attempt. `graded` exists because `awardedPoints` alone
cannot distinguish "marked zero" from "not marked yet".

**Decisions taken** (owner, 2026-09-23):

| Question | Decision |
|---|---|
| Who grades | Admin, by hand, in the dashboard |
| Student sees after submit | MCQ score immediately, essays flagged pending |
| Leaderboard | Ranks on total, reordering as marking happens |
| Essay answer limit | 2000 characters, no minimum |

**Known consequence of the leaderboard choice.** On a day with essays the board
is provisional until marking finishes, and a student watching it will see
positions move. Mitigated only by a `pending` flag per row and a footnote; the
ordering itself was the owner's explicit choice over hiding the board until
marking completes.

**New endpoints.**
- `GET /api/admin/daily-quizzes/:id/attempts/:attemptId` — one attempt in full.
  Admin-only, so unlike every public endpoint it does return `correctIndex`.
- `PATCH /api/admin/daily-quizzes/:id/attempts/:attemptId/grades` —
  `{ grades: [{ questionIndex, awardedPoints }] }`. Every mark is validated
  before any is written, and the total is recomputed from the stored answers
  rather than incremented.

**Still out of scope:** per-question marking guidance for the admin, partial
credit on MCQ, and any bulk-marking screen.

---

## Addendum — open access (2026-09-23)

The quiz is no longer limited to registered students. Anyone can take it with a
name and a Nigerian phone number.

**Identity is the phone number.** `utils/phone.js` normalizes `08012345678`,
`+2348012345678` and `2348012345678` to one key, `234XXXXXXXXXX`. A student ID
is optional and is the only thing that links a score to a dashboard; a wrong ID
is refused with a 404 rather than silently downgraded to guest, so a typo cannot
cost a student their dashboard credit without telling them.

`DailyQuizAttempt.student` becomes optional and a `participant`
`{ fullName, phone, phoneKey }` subdocument is added.

**Decisions taken** (owner, 2026-09-23):

| Question | Decision |
|---|---|
| Fields asked for | Name + phone, with an optional student ID |
| Retake rule | One attempt per phone per day |
| Leaderboard | One board for everyone: name + masked phone |
| Guest history | Lookup by phone on the public page |

**The index change is the operational risk.** The old plain unique index on
`{ quizDate, student }` rejects the *second* guest of any day, because MongoDB
treats every null as the same value. It is replaced by two partial unique
indexes — one on `{ quizDate, participant.phoneKey }`, one on
`{ quizDate, student }` — plus a lookup index. Mongoose does not rewrite an
existing index, so `src/migrations/2026-09-23-open-quiz-indexes.js` must be run
once against the database before this deploys. The migration is idempotent, has
a `--dry-run` mode, and its logic is covered by
`tests/integration/openQuizIndexMigration.test.js`, which seeds the old index
and first proves the bug exists before proving the fix works.

**Accepted risk, restated.** The original spec's ID-only risk is now wider: a
phone number is self-declared and unlimited, so one person can enter repeatedly
with different numbers and the leaderboard can be stuffed. This was raised and
accepted. The mitigations are the per-IP rate limits, the one-attempt-per-phone
rule, the stored `ipHash`, and the `verified: false` flag that a future
password-backed flow can flip.

**Privacy.** The full number never appears on a public endpoint — the board
shows `***678` — the last three digits only. `participant.phoneKey` is stripped in the model's `toJSON`.
`POST /api/daily-quiz/my-scores` is a POST so numbers stay out of logs and
Referer headers, returns no name, is rate limited at 10/hour/IP, and returns an
identical empty response for an unknown number and a known number with no
attempts, so it cannot be used to test which numbers exist.

**Still out of scope:** non-Nigerian phone numbers, any verification that the
number belongs to the person (no OTP), and merging a guest's past attempts into
a student account they create later.
