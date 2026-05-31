# Assignments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admins to create assignments for courses, and enrolled students to submit files with notes; admin can view submissions and add grades/feedback.

**Architecture:** Two new Mongoose models (`Assignment`, `Submission`). Separate multer config for file uploads (PDFs, DOCX, ZIP, images — up to 10MB). Admin CRUD for assignments + submission grading. Student can list assignments from enrolled courses, view details, and upload a submission (one per student per assignment). No websockets.

**Tech Stack:** Node.js/Express, Mongoose, multer + multer-storage-cloudinary (resource_type auto), React 19, React Router v6, Tailwind CSS, axios, lucide-react, react-hot-toast.

---

## File Map

### Backend — new files
| File | Responsibility |
|---|---|
| `sahlearn-api/src/models/Assignment.js` | Assignment schema (course, title, description, dueDate, isPublished) |
| `sahlearn-api/src/models/Submission.js` | Submission schema (assignment, student, file, note, grade, feedback, status) |
| `sahlearn-api/src/controllers/admin.assignments.controller.js` | CRUD assignments + list/grade submissions |
| `sahlearn-api/src/routes/admin.assignments.routes.js` | Admin assignment endpoints |
| `sahlearn-api/src/controllers/student.assignments.controller.js` | Student: list assignments, view, submit |
| `sahlearn-api/src/routes/student.assignments.routes.js` | Student assignment endpoints |

### Backend — modified files
| File | Change |
|---|---|
| `sahlearn-api/src/middleware/upload.js` | Add `uploadAssignment` multer instance (accepts PDF/DOCX/ZIP/images, 10MB) |
| `sahlearn-api/src/app.js` | Mount 2 new route groups |

### Frontend — new files
| File | Responsibility |
|---|---|
| `sahlearn-web/src/services/studentAssignments.service.js` | getAssignments, getAssignment, submitAssignment, getMySubmissions |
| `sahlearn-web/src/services/adminAssignments.service.js` | CRUD assignments, listSubmissions, gradeSubmission |
| `sahlearn-web/src/pages/student/Assignments.jsx` | `/student/assignments` — list assignments with submission status |
| `sahlearn-web/src/pages/student/AssignmentDetail.jsx` | `/student/assignments/:id` — detail + submission upload form |
| `sahlearn-web/src/pages/admin/Assignments.jsx` | `/admin/assignments` — list all assignments |
| `sahlearn-web/src/pages/admin/AssignmentForm.jsx` | `/admin/assignments/new` + `/admin/assignments/:id/edit` |
| `sahlearn-web/src/pages/admin/AssignmentDetail.jsx` | `/admin/assignments/:id` — submissions list + grade form |

### Frontend — modified files
| File | Change |
|---|---|
| `sahlearn-web/src/components/layout/StudentLayout.jsx` | Add Assignments nav item (ClipboardList icon) |
| `sahlearn-web/src/components/layout/AdminLayout.jsx` | Add Assignments to SIDEBAR_MANAGE + PAGE_TITLES |
| `sahlearn-web/src/routes/AppRouter.jsx` | Add 5 student + 3 admin routes |

---

## Task 1: Assignment + Submission Models

**Files:**
- Create: `sahlearn-api/src/models/Assignment.js`
- Create: `sahlearn-api/src/models/Submission.js`

- [ ] **Step 1: Create Assignment model**

```javascript
// sahlearn-api/src/models/Assignment.js
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 3000 },
    dueDate: { type: Date },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

assignmentSchema.index({ course: 1, createdAt: -1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
```

- [ ] **Step 2: Create Submission model**

```javascript
// sahlearn-api/src/models/Submission.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    file: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      originalName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
    },
    note: { type: String, trim: true, maxlength: 1000 },
    grade: { type: String, trim: true, maxlength: 20 },
    feedback: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

// One submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
```

- [ ] **Step 3: Verify both models load**

```bash
cd sahlearn-api
node -e "require('./src/models/Assignment'); require('./src/models/Submission'); console.log('models OK')"
```

Expected: `models OK`

- [ ] **Step 4: Commit**

```bash
git add sahlearn-api/src/models/Assignment.js sahlearn-api/src/models/Submission.js
git commit -m "feat(assignments): add Assignment and Submission mongoose models"
```

---

## Task 2: Upload Middleware Extension

**Files:**
- Modify: `sahlearn-api/src/middleware/upload.js`

The existing `upload.js` exports an image-only `upload` multer instance. Add a second `uploadAssignment` instance that accepts documents and images, up to 10MB, stored in `sahlearn/assignments`.

- [ ] **Step 1: Read existing upload.js**

Current file (do not remove anything):

```javascript
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const ALLOWED_FOLDERS = ['courses', 'blog', 'inline'];
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req) => {
    const folder = ALLOWED_FOLDERS.includes(req.query.folder)
      ? req.query.folder
      : 'courses';
    return {
      folder: `sahlearn/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    };
  },
});

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
```

- [ ] **Step 2: Append uploadAssignment and update exports**

Replace the final `module.exports = upload;` with:

```javascript
// Assignment file upload — accepts documents + images up to 10MB
const ASSIGNMENT_MIMES = [
  'image/jpeg', 'image/png', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
];

const assignmentStorage = new CloudinaryStorage({
  cloudinary,
  params: (_req, file) => ({
    folder: 'sahlearn/assignments',
    resource_type: 'auto',
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')}`,
  }),
});

const assignmentFileFilter = (_req, file, cb) => {
  if (ASSIGNMENT_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: PDF, Word, ZIP, JPEG, PNG, WebP'), false);
  }
};

const uploadAssignment = multer({
  storage: assignmentStorage,
  fileFilter: assignmentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = { upload, uploadAssignment };
```

**Important:** Other files import `upload` as a default import — `const upload = require('../middleware/upload')`. After this change, they will need to destructure: `const { upload } = require('../middleware/upload')`. Update all existing references:

Check which files import upload:
```bash
grep -rl "require.*middleware/upload" sahlearn-api/src/
```

For each file found, change:
```javascript
// Before
const upload = require('../middleware/upload');
// or
const upload = require('../../middleware/upload');

// After
const { upload } = require('../middleware/upload');
// or
const { upload } = require('../../middleware/upload');
```

- [ ] **Step 3: Verify upload module loads**

```bash
node -e "const { upload, uploadAssignment } = require('./src/middleware/upload'); console.log('upload OK', typeof upload, typeof uploadAssignment)"
```

Expected: `upload OK function function`

- [ ] **Step 4: Commit**

```bash
git add sahlearn-api/src/middleware/upload.js
# Add any other files that were updated
git commit -m "feat(assignments): extend upload middleware to support document/archive uploads"
```

---

## Task 3: Admin Assignments Controller + Routes

**Files:**
- Create: `sahlearn-api/src/controllers/admin.assignments.controller.js`
- Create: `sahlearn-api/src/routes/admin.assignments.routes.js`

- [ ] **Step 1: Create admin assignments controller**

```javascript
// sahlearn-api/src/controllers/admin.assignments.controller.js
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const cloudinary = require('../config/cloudinary');
const { success, successList, notFound } = require('../utils/apiResponse');

const createAssignment = async (req, res) => {
  const { course, title, description, dueDate, isPublished } = req.body;

  const assignment = await Assignment.create({
    course,
    title,
    description,
    dueDate: dueDate || undefined,
    isPublished: isPublished !== undefined ? isPublished : true,
  });

  success(res, assignment, 201);
};

const listAssignments = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.courseId) filter.course = req.query.courseId;

  const [assignments, total] = await Promise.all([
    Assignment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('course', 'title slug')
      .lean(),
    Assignment.countDocuments(filter),
  ]);

  // Attach submission counts
  const ids = assignments.map((a) => a._id);
  const counts = await Submission.aggregate([
    { $match: { assignment: { $in: ids } } },
    { $group: { _id: '$assignment', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
  const data = assignments.map((a) => ({ ...a, submissionCount: countMap[a._id.toString()] || 0 }));

  successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
};

const getAssignment = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate('course', 'title slug').lean();
  if (!assignment) return notFound(res, 'Assignment not found');

  const submissionCount = await Submission.countDocuments({ assignment: req.params.id });
  success(res, { ...assignment, submissionCount });
};

const updateAssignment = async (req, res) => {
  const allowed = ['title', 'description', 'dueDate', 'isPublished'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const assignment = await Assignment.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).populate('course', 'title slug');
  if (!assignment) return notFound(res, 'Assignment not found');
  success(res, assignment);
};

const deleteAssignment = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) return notFound(res, 'Assignment not found');

  // Delete all submission files from Cloudinary
  const submissions = await Submission.find({ assignment: req.params.id }).lean();
  await Promise.all(
    submissions.map((s) =>
      cloudinary.uploader.destroy(s.file.public_id, { resource_type: 'auto' }).catch(() => {})
    )
  );

  await Submission.deleteMany({ assignment: req.params.id });
  await assignment.deleteOne();

  success(res, { message: 'Assignment deleted' });
};

const listSubmissions = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).lean();
  if (!assignment) return notFound(res, 'Assignment not found');

  const submissions = await Submission.find({ assignment: req.params.id })
    .sort({ submittedAt: -1 })
    .populate('student', 'fullName studentId email avatar')
    .lean();

  success(res, { assignment, submissions });
};

const gradeSubmission = async (req, res) => {
  const { grade, feedback, status } = req.body;
  const updates = {};
  if (grade !== undefined) updates.grade = grade;
  if (feedback !== undefined) updates.feedback = feedback;
  if (status !== undefined) updates.status = status;
  if (grade || feedback) updates.gradedAt = new Date();

  const submission = await Submission.findByIdAndUpdate(req.params.submissionId, updates, { new: true })
    .populate('student', 'fullName studentId email avatar')
    .populate('assignment', 'title');
  if (!submission) return notFound(res, 'Submission not found');
  success(res, submission);
};

module.exports = { createAssignment, listAssignments, getAssignment, updateAssignment, deleteAssignment, listSubmissions, gradeSubmission };
```

- [ ] **Step 2: Create admin assignments routes**

```javascript
// sahlearn-api/src/routes/admin.assignments.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const {
  createAssignment,
  listAssignments,
  getAssignment,
  updateAssignment,
  deleteAssignment,
  listSubmissions,
  gradeSubmission,
} = require('../controllers/admin.assignments.controller');

router.use(authMiddleware);

router.get('/', listAssignments);
router.post(
  '/',
  [
    body('course').notEmpty().withMessage('Course ID is required'),
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 3000 }),
    body('dueDate').optional().isISO8601(),
    body('isPublished').optional().isBoolean(),
  ],
  validate,
  createAssignment
);
router.get('/:id', getAssignment);
router.patch(
  '/:id',
  [
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional().isLength({ max: 3000 }),
    body('dueDate').optional().isISO8601(),
    body('isPublished').optional().isBoolean(),
  ],
  validate,
  updateAssignment
);
router.delete('/:id', deleteAssignment);
router.get('/:id/submissions', listSubmissions);
router.patch(
  '/submissions/:submissionId',
  [
    body('grade').optional().trim().isLength({ max: 20 }),
    body('feedback').optional().isLength({ max: 2000 }),
    body('status').optional().isIn(['submitted', 'graded', 'returned']),
  ],
  validate,
  gradeSubmission
);

module.exports = router;
```

- [ ] **Step 3: Verify controller loads**

```bash
cd sahlearn-api
node -e "require('./src/controllers/admin.assignments.controller'); console.log('admin assignments controller OK')"
```

Expected: `admin assignments controller OK`

- [ ] **Step 4: Commit**

```bash
git add sahlearn-api/src/controllers/admin.assignments.controller.js sahlearn-api/src/routes/admin.assignments.routes.js
git commit -m "feat(assignments): admin assignments controller and routes"
```

---

## Task 4: Student Assignments Controller + Routes

**Files:**
- Create: `sahlearn-api/src/controllers/student.assignments.controller.js`
- Create: `sahlearn-api/src/routes/student.assignments.routes.js`

- [ ] **Step 1: Create student assignments controller**

```javascript
// sahlearn-api/src/controllers/student.assignments.controller.js
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { success, successList, notFound } = require('../utils/apiResponse');

const listAssignments = async (req, res) => {
  // Get course IDs from student's enrolled courses
  const courseIds = req.student.enrolledCourses
    .filter((ec) => ec.course)
    .map((ec) => ec.course);

  if (!courseIds.length) {
    return successList(res, [], { page: 1, limit: 20, total: 0, totalPages: 0 });
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
  const skip = (page - 1) * limit;

  const filter = { course: { $in: courseIds }, isPublished: true };

  const [assignments, total] = await Promise.all([
    Assignment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('course', 'title slug')
      .lean(),
    Assignment.countDocuments(filter),
  ]);

  // Attach own submission status
  const ids = assignments.map((a) => a._id);
  const mySubmissions = await Submission.find({
    assignment: { $in: ids },
    student: req.student._id,
  }).select('assignment status grade gradedAt').lean();

  const submissionMap = Object.fromEntries(mySubmissions.map((s) => [s.assignment.toString(), s]));

  const data = assignments.map((a) => ({
    ...a,
    mySubmission: submissionMap[a._id.toString()] || null,
  }));

  successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
};

const getAssignment = async (req, res) => {
  const courseIds = req.student.enrolledCourses
    .filter((ec) => ec.course)
    .map((ec) => ec.course.toString());

  const assignment = await Assignment.findById(req.params.id)
    .populate('course', 'title slug')
    .lean();

  if (!assignment) return notFound(res, 'Assignment not found');
  if (!assignment.isPublished) return notFound(res, 'Assignment not found');
  if (!courseIds.includes(assignment.course._id.toString())) {
    return res.status(403).json({ status: 'error', message: 'Not enrolled in this course' });
  }

  const mySubmission = await Submission.findOne({
    assignment: req.params.id,
    student: req.student._id,
  }).lean();

  success(res, { ...assignment, mySubmission: mySubmission || null });
};

const submitAssignment = async (req, res) => {
  const courseIds = req.student.enrolledCourses
    .filter((ec) => ec.course)
    .map((ec) => ec.course.toString());

  const assignment = await Assignment.findById(req.params.id).lean();
  if (!assignment || !assignment.isPublished) return notFound(res, 'Assignment not found');
  if (!courseIds.includes(assignment.course.toString())) {
    return res.status(403).json({ status: 'error', message: 'Not enrolled in this course' });
  }

  const existing = await Submission.findOne({ assignment: req.params.id, student: req.student._id });
  if (existing) {
    return res.status(409).json({ status: 'error', message: 'You have already submitted this assignment' });
  }

  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }

  const submission = await Submission.create({
    assignment: req.params.id,
    student: req.student._id,
    file: {
      url: req.file.path,
      public_id: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
    note: req.body.note || undefined,
    submittedAt: new Date(),
  });

  success(res, submission, 201);
};

const getMySubmissions = async (req, res) => {
  const submissions = await Submission.find({ student: req.student._id })
    .sort({ submittedAt: -1 })
    .populate({
      path: 'assignment',
      select: 'title dueDate course',
      populate: { path: 'course', select: 'title slug' },
    })
    .lean();

  success(res, submissions);
};

module.exports = { listAssignments, getAssignment, submitAssignment, getMySubmissions };
```

- [ ] **Step 2: Create student assignments routes**

```javascript
// sahlearn-api/src/routes/student.assignments.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const studentAuth = require('../middleware/studentAuth');
const { uploadAssignment } = require('../middleware/upload');
const { listAssignments, getAssignment, submitAssignment, getMySubmissions } = require('../controllers/student.assignments.controller');

router.use(studentAuth);

router.get('/', listAssignments);
router.get('/my-submissions', getMySubmissions);
router.get('/:id', getAssignment);
router.post(
  '/:id/submit',
  uploadAssignment.single('file'),
  [body('note').optional().trim().isLength({ max: 1000 })],
  validate,
  submitAssignment
);

module.exports = router;
```

- [ ] **Step 3: Verify controller loads**

```bash
node -e "require('./src/controllers/student.assignments.controller'); console.log('student assignments controller OK')"
```

Expected: `student assignments controller OK`

- [ ] **Step 4: Commit**

```bash
git add sahlearn-api/src/controllers/student.assignments.controller.js sahlearn-api/src/routes/student.assignments.routes.js
git commit -m "feat(assignments): student assignments controller and routes"
```

---

## Task 5: Mount Routes in app.js

**Files:**
- Modify: `sahlearn-api/src/app.js`

Current mounts at bottom of routes section:
```javascript
app.use('/api/student/messages', studentMessagesRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin/students', adminStudentsRoutes);
app.use('/api/admin/student-messages', adminStudentMessagesRoutes);
```

- [ ] **Step 1: Add imports**

After `const adminStudentMessagesRoutes = require('./routes/admin.studentMessages.routes');`, add:

```javascript
const adminAssignmentsRoutes = require('./routes/admin.assignments.routes');
const studentAssignmentsRoutes = require('./routes/student.assignments.routes');
```

- [ ] **Step 2: Add mounts**

After `app.use('/api/admin/student-messages', adminStudentMessagesRoutes);`, add:

```javascript
app.use('/api/student/assignments', studentAssignmentsRoutes);
app.use('/api/admin/assignments', adminAssignmentsRoutes);
```

Final student route order (more-specific before less-specific):
```javascript
app.use('/api/student/auth', studentAuthRoutes);
app.use('/api/student/messages', studentMessagesRoutes);
app.use('/api/student/assignments', studentAssignmentsRoutes);
app.use('/api/student', studentRoutes);
```

- [ ] **Step 3: Verify server starts**

```bash
node -e "require('./src/app'); console.log('app OK')"
```

Expected: `app OK`

- [ ] **Step 4: Commit**

```bash
git add sahlearn-api/src/app.js
git commit -m "feat(assignments): mount student and admin assignment routes"
```

---

## Task 6: Frontend Services

**Files:**
- Create: `sahlearn-web/src/services/studentAssignments.service.js`
- Create: `sahlearn-web/src/services/adminAssignments.service.js`

- [ ] **Step 1: Create student assignments service**

```javascript
// sahlearn-web/src/services/studentAssignments.service.js
import api from './api';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

export const getAssignments = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await api.get('/student/assignments', {
    params: { page, limit },
    headers: authHeader(),
  });
  return data; // { status, data: assignments[], meta }
};

export const getAssignment = async (id) => {
  const { data } = await api.get(`/student/assignments/${id}`, { headers: authHeader() });
  return data.data; // { ...assignment, mySubmission }
};

export const submitAssignment = async (id, file, note) => {
  const form = new FormData();
  form.append('file', file);
  if (note) form.append('note', note);
  const { data } = await api.post(`/student/assignments/${id}/submit`, form, {
    headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const getMySubmissions = async () => {
  const { data } = await api.get('/student/assignments/my-submissions', { headers: authHeader() });
  return data.data;
};
```

- [ ] **Step 2: Create admin assignments service**

```javascript
// sahlearn-web/src/services/adminAssignments.service.js
import api from './api';

export const getAssignments = async ({ page = 1, limit = 20, courseId } = {}) => {
  const params = { page, limit };
  if (courseId) params.courseId = courseId;
  const { data } = await api.get('/admin/assignments', { params });
  return data; // { status, data, meta }
};

export const createAssignment = async (payload) => {
  const { data } = await api.post('/admin/assignments', payload);
  return data.data;
};

export const getAssignment = async (id) => {
  const { data } = await api.get(`/admin/assignments/${id}`);
  return data.data;
};

export const updateAssignment = async (id, payload) => {
  const { data } = await api.patch(`/admin/assignments/${id}`, payload);
  return data.data;
};

export const deleteAssignment = async (id) => {
  const { data } = await api.delete(`/admin/assignments/${id}`);
  return data.data;
};

export const listSubmissions = async (id) => {
  const { data } = await api.get(`/admin/assignments/${id}/submissions`);
  return data.data; // { assignment, submissions[] }
};

export const gradeSubmission = async (submissionId, payload) => {
  const { data } = await api.patch(`/admin/assignments/submissions/${submissionId}`, payload);
  return data.data;
};
```

- [ ] **Step 3: Commit**

```bash
git add sahlearn-web/src/services/studentAssignments.service.js sahlearn-web/src/services/adminAssignments.service.js
git commit -m "feat(assignments): student and admin assignment services"
```

---

## Task 7: Student Assignment Pages

**Files:**
- Create: `sahlearn-web/src/pages/student/Assignments.jsx`
- Create: `sahlearn-web/src/pages/student/AssignmentDetail.jsx`

- [ ] **Step 1: Create student Assignments list page**

```jsx
// sahlearn-web/src/pages/student/Assignments.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAssignments } from '../../services/studentAssignments.service';
import { ClipboardList, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function StatusBadge({ submission, dueDate }) {
  if (!submission) {
    const overdue = dueDate && new Date(dueDate) < new Date();
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${overdue ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
        {overdue ? <AlertCircle size={11} /> : <Clock size={11} />}
        {overdue ? 'Overdue' : 'Pending'}
      </span>
    );
  }
  if (submission.status === 'graded' || submission.status === 'returned') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-700">
        <CheckCircle2 size={11} /> {submission.grade ? `Graded: ${submission.grade}` : 'Graded'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
      <CheckCircle2 size={11} /> Submitted
    </span>
  );
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAssignments({ limit: 50 })
      .then((res) => setAssignments(res.data))
      .catch(() => toast.error('Failed to load assignments'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-display text-ink-900">Assignments</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center">
          <ClipboardList size={40} className="mx-auto text-ink-300 mb-3" />
          <p className="text-ink-400 text-sm">No assignments yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden divide-y divide-surface-100">
          {assignments.map((a) => (
            <Link
              key={a._id}
              to={`/student/assignments/${a._id}`}
              className="flex items-start gap-4 px-5 py-4 hover:bg-surface-50 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ClipboardList size={18} className="text-brand-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-medium text-ink-900 truncate">{a.title}</p>
                  <StatusBadge submission={a.mySubmission} dueDate={a.dueDate} />
                </div>
                <p className="text-xs text-ink-400 mt-0.5">{a.course?.title}</p>
                {a.dueDate && (
                  <p className="text-xs text-ink-400 mt-0.5">
                    Due: {new Date(a.dueDate).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                {a.description && (
                  <p className="text-xs text-ink-500 mt-1 line-clamp-2">{a.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create student AssignmentDetail page**

```jsx
// sahlearn-web/src/pages/student/AssignmentDetail.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAssignment, submitAssignment } from '../../services/studentAssignments.service';
import { ArrowLeft, Upload, FileText, CheckCircle2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const ACCEPTED = '.pdf,.doc,.docx,.zip,.jpg,.jpeg,.png,.webp';

export default function AssignmentDetail() {
  const { id } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    getAssignment(id)
      .then(setAssignment)
      .catch(() => toast.error('Assignment not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { toast.error('Please select a file'); return; }
    setSubmitting(true);
    try {
      const submission = await submitAssignment(id, file, note);
      setAssignment((prev) => ({ ...prev, mySubmission: submission }));
      setFile(null);
      setNote('');
      toast.success('Assignment submitted!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!assignment) {
    return <div className="text-center py-12 text-ink-500">Assignment not found. <Link to="/student/assignments" className="text-brand-primary hover:underline">Back</Link></div>;
  }

  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();
  const submitted = !!assignment.mySubmission;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/student/assignments" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900 transition">
          <ArrowLeft size={14} /> Assignments
        </Link>
      </div>

      {/* Assignment info */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-xl font-display text-ink-900">{assignment.title}</h1>
          {isOverdue && !submitted && (
            <span className="flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-50 text-red-700">Overdue</span>
          )}
        </div>
        <p className="text-xs text-ink-400 mb-3">{assignment.course?.title}</p>
        {assignment.dueDate && (
          <p className="text-sm text-ink-500 mb-3">
            <strong>Due:</strong> {new Date(assignment.dueDate).toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        {assignment.description && (
          <p className="text-sm text-ink-700 whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
        )}
      </div>

      {/* Submission status */}
      {submitted ? (
        <div className="bg-white rounded-2xl border border-surface-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-green-600" />
            <h2 className="font-semibold text-ink-900">Submission Received</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-ink-700">
              <FileText size={14} className="text-ink-400" />
              <a href={assignment.mySubmission.file?.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline flex items-center gap-1">
                {assignment.mySubmission.file?.originalName || 'View file'} <ExternalLink size={12} />
              </a>
            </div>
            {assignment.mySubmission.note && (
              <p className="text-ink-500 text-xs mt-1">Note: {assignment.mySubmission.note}</p>
            )}
            <p className="text-xs text-ink-400">Submitted: {new Date(assignment.mySubmission.submittedAt).toLocaleDateString('en-NG')}</p>
          </div>

          {(assignment.mySubmission.grade || assignment.mySubmission.feedback) && (
            <div className="mt-4 pt-4 border-t border-surface-200">
              <p className="text-xs font-semibold text-ink-600 uppercase tracking-wide mb-2">Feedback</p>
              {assignment.mySubmission.grade && (
                <p className="text-sm font-bold text-brand-primary">Grade: {assignment.mySubmission.grade}</p>
              )}
              {assignment.mySubmission.feedback && (
                <p className="text-sm text-ink-700 mt-1 whitespace-pre-wrap">{assignment.mySubmission.feedback}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-surface-200 p-6">
          <h2 className="font-semibold text-ink-900 mb-4">Submit Assignment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">File <span className="text-ink-400">(PDF, Word, ZIP, or image — max 10MB)</span></label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-surface-300 rounded-xl p-6 text-center cursor-pointer hover:border-brand-primary/50 transition"
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-ink-700">
                    <FileText size={16} className="text-brand-primary" />
                    {file.name} <span className="text-ink-400">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                  </div>
                ) : (
                  <div>
                    <Upload size={24} className="mx-auto text-ink-300 mb-2" />
                    <p className="text-sm text-ink-400">Click to select file</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept={ACCEPTED} className="hidden" onChange={(e) => setFile(e.target.files[0] || null)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-600 mb-1">Note <span className="text-ink-400">(optional)</span></label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Any notes for your instructor..."
                className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !file}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
            >
              <Upload size={15} />
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add sahlearn-web/src/pages/student/Assignments.jsx sahlearn-web/src/pages/student/AssignmentDetail.jsx
git commit -m "feat(assignments): student Assignments list and AssignmentDetail pages"
```

---

## Task 8: Admin Assignments List + Form Pages

**Files:**
- Create: `sahlearn-web/src/pages/admin/Assignments.jsx`
- Create: `sahlearn-web/src/pages/admin/AssignmentForm.jsx`

- [ ] **Step 1: Create admin Assignments list page**

```jsx
// sahlearn-web/src/pages/admin/Assignments.jsx
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAssignments, deleteAssignment } from '../../services/adminAssignments.service';
import { Plus, ClipboardList, Users, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAssignments({ page });
      setAssignments(res.data);
      setMeta(res.meta);
    } catch {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This will also delete all student submissions.`)) return;
    try {
      await deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a._id !== id));
      toast.success('Assignment deleted');
    } catch {
      toast.error('Failed to delete assignment');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-ink-900">Assignments</h1>
          <p className="text-sm text-ink-400">{meta.total} total</p>
        </div>
        <Link
          to="/admin/assignments/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition"
        >
          <Plus size={15} /> New Assignment
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList size={36} className="mx-auto text-ink-300 mb-2" />
            <p className="text-sm text-ink-400">No assignments yet.</p>
            <Link to="/admin/assignments/new" className="mt-2 inline-block text-sm text-brand-primary hover:underline">Create one</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 text-left">
                <th className="px-4 py-3 font-medium text-ink-500">Assignment</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden md:table-cell">Course</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden lg:table-cell">Due</th>
                <th className="px-4 py-3 font-medium text-ink-500 hidden sm:table-cell">Submissions</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {assignments.map((a) => (
                <tr key={a._id} className="hover:bg-surface-50 transition">
                  <td className="px-4 py-3">
                    <Link to={`/admin/assignments/${a._id}`} className="font-medium text-ink-900 hover:text-brand-primary transition">
                      {a.title}
                    </Link>
                    {!a.isPublished && (
                      <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-200 text-ink-500">Draft</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-500 hidden md:table-cell">{a.course?.title}</td>
                  <td className="px-4 py-3 text-ink-500 hidden lg:table-cell text-xs">
                    {a.dueDate ? new Date(a.dueDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                      <Users size={12} /> {a.submissionCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/assignments/${a._id}/edit`} className="p-1.5 text-ink-400 hover:text-ink-900 transition">
                        <Pencil size={14} />
                      </Link>
                      <button onClick={() => handleDelete(a._id, a.title)} className="p-1.5 text-ink-400 hover:text-red-600 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-sm border border-surface-300 rounded-xl disabled:opacity-40 hover:bg-surface-100 transition">Prev</button>
          <span className="px-3 py-1.5 text-sm text-ink-500">{page} / {meta.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page === meta.totalPages} className="px-3 py-1.5 text-sm border border-surface-300 rounded-xl disabled:opacity-40 hover:bg-surface-100 transition">Next</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create admin AssignmentForm page (create + edit)**

The form fetches all published courses for the course selector. On create it calls `createAssignment`; on edit it loads the existing assignment and calls `updateAssignment`.

```jsx
// sahlearn-web/src/pages/admin/AssignmentForm.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createAssignment, getAssignment, updateAssignment } from '../../services/adminAssignments.service';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function AssignmentForm() {
  const { id } = useParams(); // present on edit
  const isEdit = !!id;
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    course: '',
    title: '',
    description: '',
    dueDate: '',
    isPublished: true,
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load published courses for selector
    api.get('/admin/courses?limit=100').then(({ data }) => setCourses(data.data || [])).catch(() => {});

    if (isEdit) {
      getAssignment(id)
        .then((a) => {
          setForm({
            course: a.course?._id || a.course || '',
            title: a.title,
            description: a.description || '',
            dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : '',
            isPublished: a.isPublished,
          });
        })
        .catch(() => toast.error('Failed to load assignment'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.course) { toast.error('Please select a course'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        dueDate: form.dueDate || undefined,
        description: form.description || undefined,
      };
      if (isEdit) {
        await updateAssignment(id, payload);
        toast.success('Assignment updated');
      } else {
        const created = await createAssignment(payload);
        toast.success('Assignment created');
        navigate(`/admin/assignments/${created._id}`);
        return;
      }
      navigate('/admin/assignments');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-display text-ink-900">{isEdit ? 'Edit Assignment' : 'New Assignment'}</h1>

      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Course <span className="text-red-500">*</span></label>
            <select
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              required
              className="w-full px-3 py-2.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              maxLength={200}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Week 3 Assignment"
              className="w-full px-3 py-2.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Description <span className="text-ink-400">(optional)</span></label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={3000}
              rows={5}
              placeholder="Describe what students should do..."
              className="w-full px-3 py-2 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Due Date <span className="text-ink-400">(optional)</span></label>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full px-3 py-2.5 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublished"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              className="w-4 h-4 rounded accent-brand-primary"
            />
            <label htmlFor="isPublished" className="text-sm text-ink-700">Published (visible to students)</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Assignment'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/assignments')}
              className="px-5 py-2.5 border border-surface-300 text-ink-600 text-sm font-medium rounded-xl hover:bg-surface-100 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add sahlearn-web/src/pages/admin/Assignments.jsx sahlearn-web/src/pages/admin/AssignmentForm.jsx
git commit -m "feat(assignments): admin Assignments list and AssignmentForm pages"
```

---

## Task 9: Admin AssignmentDetail Page

**Files:**
- Create: `sahlearn-web/src/pages/admin/AssignmentDetail.jsx`

This page shows the assignment info, lists all submissions, and provides an inline grade/feedback form per submission.

- [ ] **Step 1: Create admin AssignmentDetail page**

```jsx
// sahlearn-web/src/pages/admin/AssignmentDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listSubmissions, gradeSubmission } from '../../services/adminAssignments.service';
import { ArrowLeft, Pencil, ExternalLink, FileText, Users } from 'lucide-react';
import toast from 'react-hot-toast';

function GradeForm({ submission, onGraded }) {
  const [form, setForm] = useState({
    grade: submission.grade || '',
    feedback: submission.feedback || '',
    status: submission.status || 'submitted',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await gradeSubmission(submission._id, form);
      onGraded(updated);
      toast.success('Feedback saved');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="mt-3 pt-3 border-t border-surface-100 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-medium text-ink-500 mb-0.5">Grade</label>
          <input
            type="text"
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            placeholder="e.g. A, 85/100, Pass"
            maxLength={20}
            className="w-full px-2.5 py-1.5 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-ink-500 mb-0.5">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-2.5 py-1.5 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
          >
            <option value="submitted">Submitted</option>
            <option value="graded">Graded</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-medium text-ink-500 mb-0.5">Feedback</label>
        <textarea
          value={form.feedback}
          onChange={(e) => setForm({ ...form, feedback: e.target.value })}
          maxLength={2000}
          rows={2}
          placeholder="Write feedback for the student..."
          className="w-full px-2.5 py-1.5 border border-surface-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary/30 focus:border-brand-primary resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-3 py-1.5 bg-brand-primary text-white text-xs font-semibold rounded-lg hover:bg-brand-primary/90 transition disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save Feedback'}
      </button>
    </form>
  );
}

export default function AdminAssignmentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null); // { assignment, submissions[] }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSubmissions(id)
      .then(setData)
      .catch(() => toast.error('Failed to load submissions'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleGraded = (submissionId, updated) => {
    setData((prev) => ({
      ...prev,
      submissions: prev.submissions.map((s) => (s._id === submissionId ? updated : s)),
    }));
  };

  if (loading) {
    return <div className="flex justify-center py-24"><div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!data) {
    return <div className="text-center py-12 text-ink-500">Assignment not found. <Link to="/admin/assignments" className="text-brand-primary hover:underline">Back</Link></div>;
  }

  const { assignment, submissions } = data;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/admin/assignments" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900 transition">
          <ArrowLeft size={14} /> Assignments
        </Link>
      </div>

      {/* Assignment header */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display text-ink-900">{assignment.title}</h1>
            <p className="text-sm text-ink-400 mt-0.5">{assignment.course?.title}</p>
          </div>
          <Link to={`/admin/assignments/${id}/edit`} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-surface-300 rounded-xl hover:bg-surface-100 transition flex-shrink-0">
            <Pencil size={12} /> Edit
          </Link>
        </div>
        {assignment.dueDate && (
          <p className="text-sm text-ink-500 mt-3">
            <strong>Due:</strong> {new Date(assignment.dueDate).toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        {assignment.description && (
          <p className="text-sm text-ink-700 mt-3 whitespace-pre-wrap leading-relaxed">{assignment.description}</p>
        )}
      </div>

      {/* Submissions */}
      <div className="bg-white rounded-2xl border border-surface-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users size={16} className="text-ink-400" />
          <h2 className="font-semibold text-ink-900">Submissions ({submissions.length})</h2>
        </div>

        {submissions.length === 0 ? (
          <p className="text-sm text-ink-400">No submissions yet.</p>
        ) : (
          <div className="space-y-4">
            {submissions.map((s) => {
              const initials = s.student?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
              return (
                <div key={s._id} className="border border-surface-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    {s.student?.avatar?.url ? (
                      <img src={s.student.avatar.url} alt={s.student.fullName} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 text-sm">{s.student?.fullName}</p>
                      <p className="text-xs text-ink-400 font-mono">{s.student?.studentId}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.status === 'graded' || s.status === 'returned' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                        {s.status}
                      </span>
                      {s.grade && <span className="text-xs font-bold text-brand-primary">{s.grade}</span>}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-ink-500">
                    <FileText size={12} />
                    <a href={s.file?.url} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline flex items-center gap-1">
                      {s.file?.originalName || 'View file'} <ExternalLink size={11} />
                    </a>
                    <span className="text-ink-300">·</span>
                    <span>{new Date(s.submittedAt).toLocaleDateString('en-NG')}</span>
                  </div>

                  {s.note && <p className="mt-1 text-xs text-ink-500 italic">"{s.note}"</p>}

                  <GradeForm submission={s} onGraded={(updated) => handleGraded(s._id, updated)} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sahlearn-web/src/pages/admin/AssignmentDetail.jsx
git commit -m "feat(assignments): admin AssignmentDetail page with submission grading"
```

---

## Task 10: Wire Routes + Update Sidebars

**Files:**
- Modify: `sahlearn-web/src/routes/AppRouter.jsx`
- Modify: `sahlearn-web/src/components/layout/StudentLayout.jsx`
- Modify: `sahlearn-web/src/components/layout/AdminLayout.jsx`

### 10A — AppRouter.jsx

Add lazy imports after student messages import:

```jsx
const StudentAssignments = lazy(() => import('../pages/student/Assignments'));
const StudentAssignmentDetail = lazy(() => import('../pages/student/AssignmentDetail'));
```

Add lazy imports for admin assignment pages:

```jsx
const AdminAssignments = lazy(() => import('../pages/admin/Assignments'));
const AdminAssignmentForm = lazy(() => import('../pages/admin/AssignmentForm'));
const AdminAssignmentDetail = lazy(() => import('../pages/admin/AssignmentDetail'));
```

Inside the student portal `<Route path="/student" ...>` block, add:

```jsx
<Route path="assignments" element={<StudentAssignments />} />
<Route path="assignments/:id" element={<StudentAssignmentDetail />} />
```

Inside the admin `<Route path="/admin" ...>` block, add:

```jsx
<Route path="assignments" element={<AdminAssignments />} />
<Route path="assignments/new" element={<AdminAssignmentForm />} />
<Route path="assignments/:id" element={<AdminAssignmentDetail />} />
<Route path="assignments/:id/edit" element={<AdminAssignmentForm />} />
```

### 10B — StudentLayout.jsx

Add `ClipboardList` to the lucide-react import:

```jsx
import { LayoutDashboard, BookOpen, User, LogOut, Sprout, MessageCircle, ClipboardList } from 'lucide-react';
```

Add Assignments to `NAV_ITEMS` (between My Courses and Messages):

```jsx
const NAV_ITEMS = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/courses', label: 'My Courses', icon: BookOpen },
  { to: '/student/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/student/messages', label: 'Messages', icon: MessageCircle },
  { to: '/student/profile', label: 'Profile', icon: User },
];
```

### 10C — AdminLayout.jsx

`ClipboardList` needs to be imported. Add it to the lucide-react import:

```jsx
import {
  LayoutDashboard, BookOpen, FileText,
  MessageSquare, Users, UserCog,
  LogOut, Sprout, Bell, GraduationCap, MessageCircle, ClipboardList,
} from 'lucide-react';
```

Add to `SIDEBAR_MANAGE` (between Enrollments and Students):

```jsx
const SIDEBAR_MANAGE = [
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/enrollments', label: 'Enrollments', icon: Users },
  { to: '/admin/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/student-messages', label: 'Student Messages', icon: MessageCircle },
  { to: '/admin/team', label: 'Team', icon: UserCog },
];
```

Add to `PAGE_TITLES`:

```javascript
'/admin/assignments': 'Assignments',
```

- [ ] **Step 1: Apply all three file changes described above**

- [ ] **Step 2: Commit**

```bash
git add sahlearn-web/src/routes/AppRouter.jsx sahlearn-web/src/components/layout/StudentLayout.jsx sahlearn-web/src/components/layout/AdminLayout.jsx
git commit -m "feat(assignments): wire assignment routes and update both sidebars"
```
