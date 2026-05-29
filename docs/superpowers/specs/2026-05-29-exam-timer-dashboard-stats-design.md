# Design: Exam Timer + Student Dashboard Stats

**Date:** 2026-05-29  
**Scope:** Two features — frontend exam countdown with auto-submit, and student dashboard stat cards via new backend endpoint.

---

## Context

Features 1 (student password change) and 2 (email on account creation) were found to be already fully implemented during exploration. Only features 3 and 4 require work.

---

## Feature 1: Exam Timer

### Approach
Frontend-only timer with localStorage persistence. No schema changes.

### Behaviour
- Timer activates only when `exam.duration > 0` and exam is not yet submitted.
- On load: read `sahlearn_exam_start_{examId}` from localStorage.
  - If found: `remaining = duration * 60 - (now - startedAt) / 1000`
  - If remaining ≤ 0: auto-submit immediately.
  - If not found: write `Date.now()` to localStorage, start fresh.
- `setInterval(1000)` decrements remaining each second.
- On expire (remaining hits 0): call `handleSubmit()` automatically, clear localStorage key.
- On successful submit (manual or auto): clear localStorage key.
- If student already submitted (results view): no timer shown.

### Warning thresholds
| Remaining | UI change |
|---|---|
| > 5 min | Green badge `⏱ MM:SS` |
| ≤ 5 min | Amber badge + warning banner: "5 minutes remaining — your exam will auto-submit" |
| ≤ 1 min | Red badge |

### Files changed
- `sahlearn-web/src/pages/student/ExamTake.jsx` — add timer state, localStorage logic, warning UI, auto-submit trigger

---

## Feature 2: Student Dashboard Stats

### Backend

**New route:** `GET /api/student/stats` — added to `student.routes.js`, protected by existing `studentAuth` middleware.

**New controller function:** `getStats` in `student.controller.js`.

Queries run in parallel:
```js
Promise.all([
  Submission.countDocuments({ student: req.student._id }),
  Submission.countDocuments({ student: req.student._id, status: { $in: ['submitted', 'graded', 'returned'] } }),
  ExamAttempt.countDocuments({ student: req.student._id }),
  ExamAttempt.aggregate([
    { $match: { student: req.student._id, maxScore: { $gt: 0 } } },
    { $group: { _id: null, avg: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } } } },
  ]),
])
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "assignments": { "total": 8, "submitted": 5, "pending": 3 },
    "exams": { "taken": 4, "avgScore": 74 }
  }
}
```

`avgScore` is rounded to nearest integer. Returns `null` if no attempts.

### Frontend

**New service function:** `getStats()` in `student.service.js` → `GET /api/student/stats`.

**Dashboard changes** (`Dashboard.jsx`):
- Fetch stats in parallel with `getMe` using `Promise.all`.
- Add 3 stat cards to existing grid:
  - Assignments: `5 / 8 submitted` (ClipboardList icon)
  - Exams Taken: `4` (FileText icon)
  - Avg Score: `74%` (TrendingUp icon) — hidden if `avgScore === null`
- Cards show `—` skeleton during load.
- Zero state: cards still render with `0` values.

### Files changed
- `sahlearn-api/src/controllers/student.controller.js` — add `getStats`
- `sahlearn-api/src/routes/student.routes.js` — add `GET /stats` route
- `sahlearn-web/src/services/student.service.js` — add `getStats`
- `sahlearn-web/src/pages/student/Dashboard.jsx` — fetch and display stats

---

## What is NOT changing
- No Exam/ExamAttempt/Submission schema changes
- No new pages or routes beyond `GET /api/student/stats`
- No changes to admin dashboard
- Password change and account creation email already complete — no work needed
