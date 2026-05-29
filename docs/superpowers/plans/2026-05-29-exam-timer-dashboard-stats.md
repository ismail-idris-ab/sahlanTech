# Exam Timer + Student Dashboard Stats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a countdown exam timer with auto-submit to the student exam page, and add global stats (assignments, exams, avg score) to the student dashboard.

**Architecture:** Two independent features. Timer is frontend-only — localStorage tracks start time, `setInterval` counts down, auto-submits on expire. Stats use a new `GET /api/student/stats` backend endpoint that aggregates from `Submission` and `ExamAttempt` models; the dashboard fetches it in parallel with `getMe`.

**Tech Stack:** React, Tailwind CSS, Node/Express, Mongoose, lucide-react

---

## File Map

| File | Change |
|---|---|
| `sahlearn-web/src/pages/student/ExamTake.jsx` | Add timer state, localStorage logic, warning UI, auto-submit |
| `sahlearn-api/src/controllers/student.controller.js` | Add `getStats` function |
| `sahlearn-api/src/routes/student.routes.js` | Add `GET /stats` route |
| `sahlearn-web/src/services/student.service.js` | Add `getStats` export |
| `sahlearn-web/src/pages/student/Dashboard.jsx` | Fetch stats, render 3 new stat cards |

---

## Task 1: Exam Timer in ExamTake.jsx

**Files:**
- Modify: `sahlearn-web/src/pages/student/ExamTake.jsx`

- [ ] **Step 1: Replace ExamTake.jsx with timer-integrated version**

Replace the entire file content with the following:

```jsx
// sahlearn-web/src/pages/student/ExamTake.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getExam, submitExam } from '../../services/studentExams.service';
import { ArrowLeft, CheckCircle2, XCircle, Timer } from 'lucide-react';
import toast from 'react-hot-toast';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

function TimerBadge({ timeLeft }) {
  if (timeLeft === null) return null;
  const isRed = timeLeft < 60;
  const isAmber = timeLeft < 300 && timeLeft >= 60;
  const cls = isRed
    ? 'bg-red-50 border border-red-200 text-red-700'
    : isAmber
    ? 'bg-amber-50 border border-amber-200 text-amber-700'
    : 'bg-green-50 border border-green-200 text-green-700';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-sm font-mono font-semibold ${cls}`}>
      <Timer size={14} />
      {formatTime(timeLeft)}
    </span>
  );
}

function ResultsView({ exam, attempt }) {
  const answersMap = Object.fromEntries(
    (attempt.answers || []).map((a) => [a.questionIndex, a])
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <h2 className="font-semibold text-ink-900 text-lg mb-1">Your Results</h2>
        <p className="text-3xl font-bold text-brand-primary">
          {attempt.score} <span className="text-lg font-normal text-ink-400">/ {attempt.maxScore}</span>
        </p>
        <p className="text-sm text-ink-400 mt-1">
          Status: <span className="capitalize font-medium text-ink-700">{attempt.status}</span>
        </p>
        {attempt.adminNote && (
          <div className="mt-4 p-3 bg-surface-100 rounded-xl text-sm text-ink-700">
            <span className="font-medium text-ink-500 block text-xs uppercase tracking-wide mb-1">Admin Note</span>
            {attempt.adminNote}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {exam.questions.map((q, i) => {
          const answer = answersMap[i];
          const isCorrect = q.type === 'mcq' && answer?.selectedIndex === q.correctIndex;

          return (
            <div key={i} className="bg-white rounded-2xl border border-surface-200 p-5">
              <div className="flex items-start gap-2 mb-3">
                <span className="text-xs font-medium text-ink-400 flex-shrink-0 mt-0.5">Q{i + 1}</span>
                <p className="text-sm font-medium text-ink-900 flex-1">{q.text}</p>
                {q.type === 'mcq' && (
                  isCorrect
                    ? <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                    : <XCircle size={16} className="text-red-500 flex-shrink-0" />
                )}
              </div>

              {q.type === 'mcq' && (
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => {
                    const isSelected = answer?.selectedIndex === oi;
                    const isCorrectOption = q.correctIndex === oi;
                    let cls = 'px-3 py-2 rounded-xl text-sm border ';
                    if (isCorrectOption) cls += 'bg-green-50 border-green-200 text-green-800';
                    else if (isSelected && !isCorrectOption) cls += 'bg-red-50 border-red-200 text-red-700';
                    else cls += 'border-surface-200 text-ink-600';
                    return (
                      <div key={oi} className={cls}>
                        {opt}
                        {isCorrectOption && <span className="ml-2 text-xs font-medium">(correct)</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'short' && answer?.textAnswer && (
                <div className="mt-2 p-3 bg-surface-100 rounded-xl text-sm text-ink-700">
                  <span className="text-xs text-ink-400 block mb-1">Your answer:</span>
                  {answer.textAnswer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ExamTake() {
  const { id } = useParams();
  const timerKey = `sahlearn_exam_start_${id}`;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [attempt, setAttempt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // Keep a ref to answers so the timer interval can read the latest value
  const answersRef = useRef({});
  useEffect(() => { answersRef.current = answers; }, [answers]);

  // Core submit logic — shared by manual submit and auto-submit
  const doSubmit = async (answersArray) => {
    setSubmitting(true);
    try {
      const result = await submitExam(id, answersArray);
      localStorage.removeItem(timerKey);
      setAttempt(result);
      setSubmitted(true);
      const updated = await getExam(id);
      setData(updated);
      toast.success('Exam submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Load exam
  useEffect(() => {
    getExam(id)
      .then((res) => {
        setData(res);
        if (res.myAttempt) {
          setAttempt(res.myAttempt);
          setSubmitted(true);
          localStorage.removeItem(`sahlearn_exam_start_${id}`);
        }
      })
      .catch(() => toast.error('Failed to load exam'))
      .finally(() => setLoading(false));
  }, [id]);

  // Start timer once exam data is loaded and not yet submitted
  useEffect(() => {
    if (!data?.exam || submitted || !data.exam.duration) return;

    const duration = data.exam.duration * 60; // convert minutes to seconds

    let startedAt = parseInt(localStorage.getItem(timerKey), 10);
    if (!startedAt) {
      startedAt = Date.now();
      localStorage.setItem(timerKey, String(startedAt));
    }

    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    const remaining = duration - elapsed;

    if (remaining <= 0) {
      // Expired before page loaded — auto-submit immediately
      toast('Time is up! Auto-submitting...', { icon: '⏱' });
      doSubmit(Object.values(answersRef.current));
      return;
    }

    setTimeLeft(remaining);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          toast('Time is up! Auto-submitting...', { icon: '⏱' });
          doSubmit(Object.values(answersRef.current));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [data, submitted]);

  const handleSubmit = async () => {
    if (!window.confirm('Submit your exam? You cannot change answers after submission.')) return;
    await doSubmit(Object.values(answers));
  };

  const handleSelect = (qIndex, selectedIndex) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: { ...prev[qIndex], questionIndex: qIndex, selectedIndex } }));
  };

  const handleText = (qIndex, textAnswer) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: { ...prev[qIndex], questionIndex: qIndex, textAnswer } }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data?.exam) {
    return (
      <div className="text-center py-12 text-ink-500">
        Exam not found.{' '}
        <Link to="/student/exams" className="text-brand-primary hover:underline">Back to exams</Link>
      </div>
    );
  }

  const { exam } = data;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/student/exams" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900 transition">
        <ArrowLeft size={14} /> Exams
      </Link>

      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-display text-ink-900">{exam.title}</h1>
            <p className="text-sm text-ink-400 mt-0.5">{exam.course?.title}</p>
            {exam.description && <p className="text-sm text-ink-600 mt-3">{exam.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-xs text-ink-400">
              <span>{exam.questions?.length || 0} questions</span>
              <span>{exam.totalPoints} points total</span>
              {exam.duration && <span>{exam.duration} min</span>}
              {exam.dueDate && (
                <span>Due {new Date(exam.dueDate).toLocaleDateString('en-NG')}</span>
              )}
            </div>
          </div>
          {!submitted && <TimerBadge timeLeft={timeLeft} />}
        </div>
      </div>

      {/* Warning banner at 5 minutes */}
      {!submitted && timeLeft !== null && timeLeft <= 300 && timeLeft > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
          <Timer size={15} className="flex-shrink-0" />
          <span>
            {timeLeft <= 60
              ? 'Less than 1 minute remaining — your exam will auto-submit soon.'
              : 'Less than 5 minutes remaining — your exam will auto-submit when time runs out.'}
          </span>
        </div>
      )}

      {submitted && attempt ? (
        <ResultsView exam={exam} attempt={attempt} />
      ) : (
        <>
          <div className="space-y-4">
            {exam.questions.map((q, i) => (
              <div key={i} className="bg-white rounded-2xl border border-surface-200 p-5">
                <div className="flex items-start gap-2 mb-3">
                  <span className="text-xs font-medium text-ink-400 flex-shrink-0 mt-0.5">Q{i + 1} · {q.points}pt</span>
                  <p className="text-sm font-medium text-ink-900 flex-1">{q.text}</p>
                </div>

                {q.type === 'mcq' && (
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const selected = answers[i]?.selectedIndex === oi;
                      return (
                        <button
                          key={oi}
                          onClick={() => handleSelect(i, oi)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition ${
                            selected
                              ? 'bg-brand-primary/10 border-brand-primary text-brand-primary font-medium'
                              : 'border-surface-200 text-ink-700 hover:bg-surface-50'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'short' && (
                  <textarea
                    value={answers[i]?.textAnswer || ''}
                    onChange={(e) => handleText(i, e.target.value)}
                    rows={3}
                    placeholder="Write your answer here..."
                    className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="pb-8">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-brand-primary text-white font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify timer renders correctly**

Start the frontend dev server and navigate to any published exam at `/student/exams/:id`.

Expected:
- If exam has `duration > 0`: timer badge appears in top-right of exam header showing `MM:SS` in green
- If exam has no duration: no timer badge shown
- Refresh page: timer resumes from where it left off (not reset to full duration)
- At ≤ 5 min: badge turns amber, warning banner appears below header card
- At ≤ 1 min: badge turns red

- [ ] **Step 3: Commit**

```bash
git add sahlearn-web/src/pages/student/ExamTake.jsx
git commit -m "feat(student): add exam countdown timer with auto-submit"
```

---

## Task 2: Backend — getStats endpoint

**Files:**
- Modify: `sahlearn-api/src/controllers/student.controller.js`
- Modify: `sahlearn-api/src/routes/student.routes.js`

- [ ] **Step 1: Add getStats to student.controller.js**

Open `sahlearn-api/src/controllers/student.controller.js`. Add the two model requires at the top and append `getStats`:

```js
// sahlearn-api/src/controllers/student.controller.js
const cloudinary = require('../config/cloudinary');
const Student = require('../models/Student');
const Submission = require('../models/Submission');
const ExamAttempt = require('../models/ExamAttempt');
const Assignment = require('../models/Assignment');
const { success } = require('../utils/apiResponse');

// ... existing getMe, updateMe, uploadAvatar, deleteAvatar, changePassword unchanged ...

const getStats = async (req, res) => {
  const studentId = req.student._id;
  const courseIds = req.student.enrolledCourses.map((ec) => ec.course);

  const [totalAssignments, submittedCount, examsTaken, avgScoreResult] = await Promise.all([
    Assignment.countDocuments({ course: { $in: courseIds }, isPublished: true }),
    Submission.countDocuments({ student: studentId }),
    ExamAttempt.countDocuments({ student: studentId }),
    ExamAttempt.aggregate([
      { $match: { student: studentId, maxScore: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avg: { $avg: { $multiply: [{ $divide: ['$score', '$maxScore'] }, 100] } },
        },
      },
    ]),
  ]);

  const avgScore = avgScoreResult[0] ? Math.round(avgScoreResult[0].avg) : null;

  success(res, {
    assignments: {
      total: totalAssignments,
      submitted: submittedCount,
      pending: Math.max(0, totalAssignments - submittedCount),
    },
    exams: {
      taken: examsTaken,
      avgScore,
    },
  });
};

module.exports = { getMe, updateMe, uploadAvatar, deleteAvatar, changePassword, getStats };
```

- [ ] **Step 2: Register route in student.routes.js**

Open `sahlearn-api/src/routes/student.routes.js`. Add import for `getStats` and register the route. Full updated file:

```js
// sahlearn-api/src/routes/student.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const studentAuth = require('../middleware/studentAuth');
const { upload } = require('../middleware/upload');
const { getMe, updateMe, uploadAvatar, deleteAvatar, changePassword, getStats } = require('../controllers/student.controller');

router.use(studentAuth);

router.get('/me', getMe);
router.get('/stats', getStats);

router.patch(
  '/me',
  [
    body('fullName').optional().isLength({ min: 2, max: 100 }),
    body('bio').optional().isLength({ max: 300 }),
    body('dateOfBirth').optional().isISO8601(),
  ],
  validate,
  updateMe
);

router.post('/me/avatar', upload.single('image'), uploadAvatar);
router.delete('/me/avatar', deleteAvatar);

router.patch(
  '/me/password',
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  changePassword
);

module.exports = router;
```

- [ ] **Step 3: Test the endpoint manually**

With backend running, call with a valid student token:

```
GET http://localhost:5000/api/student/stats
Authorization: Bearer <student_token>
```

Expected response:
```json
{
  "status": "success",
  "data": {
    "assignments": { "total": 3, "submitted": 1, "pending": 2 },
    "exams": { "taken": 1, "avgScore": 80 }
  }
}
```

If student has no attempts, `avgScore` will be `null`. If no assignments exist, counts will be `0`. Both are correct.

- [ ] **Step 4: Commit**

```bash
git add sahlearn-api/src/controllers/student.controller.js sahlearn-api/src/routes/student.routes.js
git commit -m "feat(api): add GET /api/student/stats endpoint"
```

---

## Task 3: Frontend — Stats service + Dashboard

**Files:**
- Modify: `sahlearn-web/src/services/student.service.js`
- Modify: `sahlearn-web/src/pages/student/Dashboard.jsx`

- [ ] **Step 1: Add getStats to student.service.js**

Append one export to `sahlearn-web/src/services/student.service.js`:

```js
export const getStats = async () => {
  const { data } = await api.get('/api/student/stats', { headers: authHeader() });
  return data.data;
};
```

Full updated file for reference:

```js
import api from './api';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

export const getMe = async () => {
  const { data } = await api.get('/api/student/me', { headers: authHeader() });
  return data.data;
};

export const updateProfile = async (updates) => {
  const { data } = await api.patch('/api/student/me', updates, { headers: authHeader() });
  return data.data;
};

export const uploadAvatar = async (file) => {
  const form = new FormData();
  form.append('image', file);
  const { data } = await api.post('/api/student/me/avatar', form, {
    headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const deleteAvatar = async () => {
  const { data } = await api.delete('/api/student/me/avatar', { headers: authHeader() });
  return data.data;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const { data } = await api.patch('/api/student/me/password', { currentPassword, newPassword }, { headers: authHeader() });
  return data.data;
};

export const getStats = async () => {
  const { data } = await api.get('/api/student/stats', { headers: authHeader() });
  return data.data;
};
```

- [ ] **Step 2: Update Dashboard.jsx**

Replace `sahlearn-web/src/pages/student/Dashboard.jsx` with:

```jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { getMe, getStats } from '../../services/student.service';
import { BookOpen, User, ClipboardList, FileText, TrendingUp } from 'lucide-react';

export default function StudentDashboard() {
  const { student, setStudent } = useStudentAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(!student?.enrolledCourses);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [me, s] = await Promise.all([
          student?.enrolledCourses ? Promise.resolve(student) : getMe(),
          getStats(),
        ]);
        setStudent(me);
        setStats(s);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const courseCount = student?.enrolledCourses?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Welcome back, {student?.fullName?.split(' ')[0]}</h1>
        <p className="text-sm text-ink-400 mt-0.5">Student ID: {student?.studentId}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Enrolled courses */}
        <div className="bg-white rounded-2xl border border-surface-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen size={22} className="text-brand-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-ink-900">{courseCount}</p>
            <p className="text-sm text-ink-400">Enrolled Course{courseCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-2xl border border-surface-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <ClipboardList size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-ink-900">
              {stats ? `${stats.assignments.submitted} / ${stats.assignments.total}` : '—'}
            </p>
            <p className="text-sm text-ink-400">Assignments Submitted</p>
            {stats && stats.assignments.pending > 0 && (
              <p className="text-xs text-amber-600 font-medium mt-0.5">{stats.assignments.pending} pending</p>
            )}
          </div>
        </div>

        {/* Exams */}
        <div className="bg-white rounded-2xl border border-surface-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <FileText size={22} className="text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-ink-900">
              {stats ? stats.exams.taken : '—'}
            </p>
            <p className="text-sm text-ink-400">Exams Taken</p>
            {stats?.exams.avgScore !== null && stats?.exams.avgScore !== undefined && (
              <p className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1">
                <TrendingUp size={11} /> Avg {stats.exams.avgScore}%
              </p>
            )}
          </div>
        </div>

        {/* Profile link */}
        <Link to="/student/profile" className="bg-white rounded-2xl border border-surface-200 p-5 flex items-center gap-4 hover:border-brand-primary/30 transition">
          <div className="w-12 h-12 rounded-xl bg-ink-100 flex items-center justify-center flex-shrink-0">
            <User size={22} className="text-ink-500" />
          </div>
          <div>
            <p className="font-semibold text-ink-900">My Profile</p>
            <p className="text-sm text-ink-400">Update info & photo</p>
          </div>
        </Link>
      </div>

      {/* Recent courses */}
      {courseCount > 0 && (
        <div className="bg-white rounded-2xl border border-surface-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-900">My Courses</h2>
            <Link to="/student/courses" className="text-xs text-brand-primary hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {student.enrolledCourses.slice(0, 3).map((ec) => (
              <div key={ec.enrollmentId || ec.course?._id} className="flex items-center gap-3">
                {ec.course?.coverImage?.url ? (
                  <img src={ec.course.coverImage.url} alt={ec.course.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-surface-200 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{ec.course?.title || 'Course'}</p>
                  <p className="text-xs text-ink-400">{ec.course?.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify dashboard in browser**

Navigate to `/student/dashboard`.

Expected:
- 4 stat cards visible: Enrolled Courses, Assignments Submitted, Exams Taken, My Profile
- Assignments card shows `X / Y submitted` with "Z pending" in amber if pending > 0
- Exams card shows count + avg score percentage in green if student has taken at least one exam
- If no exams taken: avg score line hidden
- Cards show `—` only during the brief loading state (spinner shown instead of cards anyway)

- [ ] **Step 4: Commit**

```bash
git add sahlearn-web/src/services/student.service.js sahlearn-web/src/pages/student/Dashboard.jsx
git commit -m "feat(student): add stats cards to dashboard"
```
