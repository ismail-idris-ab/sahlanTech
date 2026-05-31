# Student ↔ Admin Messaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a direct messaging channel between each student and the admin, accessible from both the student portal and the admin dashboard.

**Architecture:** Single `Message` Mongoose model with `student` reference and `sender` enum (`'student' | 'admin'`). Each student has one flat conversation thread with admin. No websockets — simple REST with client-side polling every 15 seconds on the open conversation page. Read receipts tracked with `readByAdmin` and `readByStudent` booleans.

**Tech Stack:** Node.js/Express, Mongoose, React 19, React Router v6, Tailwind CSS, axios, lucide-react, react-hot-toast.

---

## File Map

### Backend — new files
| File | Responsibility |
|---|---|
| `sahlearn-api/src/models/Message.js` | Message schema |
| `sahlearn-api/src/controllers/student.messages.controller.js` | Student: get conversation, send message |
| `sahlearn-api/src/routes/student.messages.routes.js` | Mount under `/api/student/messages` |
| `sahlearn-api/src/controllers/admin.studentMessages.controller.js` | Admin: list conversations, get/reply/mark-read |
| `sahlearn-api/src/routes/admin.studentMessages.routes.js` | Mount under `/api/admin/student-messages` |

### Backend — modified files
| File | Change |
|---|---|
| `sahlearn-api/src/app.js` | Mount 2 new route groups |

### Frontend — new files
| File | Responsibility |
|---|---|
| `sahlearn-web/src/services/studentMessages.service.js` | getMessages, sendMessage API calls |
| `sahlearn-web/src/services/adminStudentMessages.service.js` | listConversations, getConversation, sendReply, markRead, getUnreadCount |
| `sahlearn-web/src/pages/student/Messages.jsx` | `/student/messages` — conversation thread + send form |
| `sahlearn-web/src/pages/admin/StudentConversations.jsx` | `/admin/student-messages` — list of all student conversations |
| `sahlearn-web/src/pages/admin/StudentConversation.jsx` | `/admin/student-messages/:studentId` — single thread + reply |

### Frontend — modified files
| File | Change |
|---|---|
| `sahlearn-web/src/components/layout/StudentLayout.jsx` | Add Messages nav item (MessageCircle icon) |
| `sahlearn-web/src/components/layout/AdminLayout.jsx` | Add Student Messages to SIDEBAR_MANAGE + PAGE_TITLES |
| `sahlearn-web/src/routes/AppRouter.jsx` | Add 3 new routes |

---

## Task 1: Message Model

**Files:**
- Create: `sahlearn-api/src/models/Message.js`

- [ ] **Step 1: Create Message model**

```javascript
// sahlearn-api/src/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    sender: { type: String, enum: ['student', 'admin'], required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    readByAdmin: { type: Boolean, default: false },
    readByStudent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ student: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
```

- [ ] **Step 2: Verify model loads**

```bash
cd sahlearn-api
node -e "require('./src/models/Message'); console.log('Message model OK')"
```

Expected: `Message model OK`

- [ ] **Step 3: Commit**

```bash
git add sahlearn-api/src/models/Message.js
git commit -m "feat(messaging): add Message mongoose model"
```

---

## Task 2: Student Messages Controller + Routes

**Files:**
- Create: `sahlearn-api/src/controllers/student.messages.controller.js`
- Create: `sahlearn-api/src/routes/student.messages.routes.js`

- [ ] **Step 1: Create student messages controller**

```javascript
// sahlearn-api/src/controllers/student.messages.controller.js
const Message = require('../models/Message');
const { success, successList } = require('../utils/apiResponse');

const getMessages = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30));
  const skip = (page - 1) * limit;

  const filter = { student: req.student._id };

  const [messages, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    Message.countDocuments(filter),
  ]);

  // Mark all admin messages as read by student
  await Message.updateMany(
    { student: req.student._id, sender: 'admin', readByStudent: false },
    { readByStudent: true }
  );

  successList(res, messages, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

const sendMessage = async (req, res) => {
  const { content } = req.body;

  const message = await Message.create({
    student: req.student._id,
    sender: 'student',
    content,
    readByAdmin: false,
    readByStudent: true,
  });

  success(res, message, 201);
};

const getUnreadCount = async (req, res) => {
  const count = await Message.countDocuments({
    student: req.student._id,
    sender: 'admin',
    readByStudent: false,
  });
  success(res, { count });
};

module.exports = { getMessages, sendMessage, getUnreadCount };
```

- [ ] **Step 2: Create student messages routes**

```javascript
// sahlearn-api/src/routes/student.messages.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const studentAuth = require('../middleware/studentAuth');
const { getMessages, sendMessage, getUnreadCount } = require('../controllers/student.messages.controller');

router.use(studentAuth);

router.get('/', getMessages);
router.get('/unread-count', getUnreadCount);
router.post(
  '/',
  [body('content').trim().notEmpty().isLength({ max: 2000 })],
  validate,
  sendMessage
);

module.exports = router;
```

- [ ] **Step 3: Verify controller loads**

```bash
node -e "require('./src/controllers/student.messages.controller'); console.log('student messages controller OK')"
```

Expected: `student messages controller OK`

- [ ] **Step 4: Commit**

```bash
git add sahlearn-api/src/controllers/student.messages.controller.js sahlearn-api/src/routes/student.messages.routes.js
git commit -m "feat(messaging): student messages controller and routes"
```

---

## Task 3: Admin Student Messages Controller + Routes

**Files:**
- Create: `sahlearn-api/src/controllers/admin.studentMessages.controller.js`
- Create: `sahlearn-api/src/routes/admin.studentMessages.routes.js`

- [ ] **Step 1: Create admin student messages controller**

```javascript
// sahlearn-api/src/controllers/admin.studentMessages.controller.js
const Message = require('../models/Message');
const Student = require('../models/Student');
const { success, successList, notFound } = require('../utils/apiResponse');

const listConversations = async (req, res) => {
  // Aggregate: one entry per student, last message + unread count
  const conversations = await Message.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$student',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$sender', 'student'] }, { $eq: ['$readByAdmin', false] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: '$student' },
    {
      $project: {
        _id: 0,
        studentId: '$student._id',
        studentName: '$student.fullName',
        studentCode: '$student.studentId',
        studentAvatar: '$student.avatar',
        lastMessage: 1,
        unreadCount: 1,
      },
    },
  ]);

  success(res, conversations);
};

const getConversation = async (req, res) => {
  const student = await Student.findById(req.params.studentId).lean();
  if (!student) return notFound(res, 'Student not found');

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  const filter = { student: req.params.studentId };
  const [messages, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    Message.countDocuments(filter),
  ]);

  // Mark all student messages as read by admin
  await Message.updateMany(
    { student: req.params.studentId, sender: 'student', readByAdmin: false },
    { readByAdmin: true }
  );

  success(res, {
    student: {
      id: student._id,
      studentId: student.studentId,
      fullName: student.fullName,
      email: student.email,
      avatar: student.avatar,
    },
    messages,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

const sendReply = async (req, res) => {
  const student = await Student.findById(req.params.studentId).lean();
  if (!student) return notFound(res, 'Student not found');

  const message = await Message.create({
    student: req.params.studentId,
    sender: 'admin',
    content: req.body.content,
    readByAdmin: true,
    readByStudent: false,
  });

  success(res, message, 201);
};

const getTotalUnread = async (req, res) => {
  const count = await Message.countDocuments({ sender: 'student', readByAdmin: false });
  success(res, { count });
};

module.exports = { listConversations, getConversation, sendReply, getTotalUnread };
```

- [ ] **Step 2: Create admin student messages routes**

```javascript
// sahlearn-api/src/routes/admin.studentMessages.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const { listConversations, getConversation, sendReply, getTotalUnread } = require('../controllers/admin.studentMessages.controller');

router.use(authMiddleware);

router.get('/', listConversations);
router.get('/unread-count', getTotalUnread);
router.get('/:studentId', getConversation);
router.post(
  '/:studentId',
  [body('content').trim().notEmpty().isLength({ max: 2000 })],
  validate,
  sendReply
);

module.exports = router;
```

- [ ] **Step 3: Verify controller loads**

```bash
node -e "require('./src/controllers/admin.studentMessages.controller'); console.log('admin student messages controller OK')"
```

Expected: `admin student messages controller OK`

- [ ] **Step 4: Commit**

```bash
git add sahlearn-api/src/controllers/admin.studentMessages.controller.js sahlearn-api/src/routes/admin.studentMessages.routes.js
git commit -m "feat(messaging): admin student messages controller and routes"
```

---

## Task 4: Mount Routes in app.js

**Files:**
- Modify: `sahlearn-api/src/app.js`

Current state of `app.js` already has these mounts at the bottom of the routes section:
```javascript
app.use('/api/student/auth', studentAuthRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin/students', adminStudentsRoutes);
```

- [ ] **Step 1: Add imports and mounts**

After line `const adminStudentsRoutes = require('./routes/admin.students.routes');`, add:

```javascript
const studentMessagesRoutes = require('./routes/student.messages.routes');
const adminStudentMessagesRoutes = require('./routes/admin.studentMessages.routes');
```

After line `app.use('/api/admin/students', adminStudentsRoutes);`, add:

```javascript
app.use('/api/student/messages', studentMessagesRoutes);
app.use('/api/admin/student-messages', adminStudentMessagesRoutes);
```

**Important:** `app.use('/api/student/messages', ...)` must be mounted BEFORE `app.use('/api/student', studentRoutes)` is NOT needed — Express matches by prefix and `/api/student/messages` is more specific than `/api/student`, but to be safe mount the more-specific routes first. Reorder so that `/api/student/messages` comes before `/api/student`.

Final order should be:
```javascript
app.use('/api/student/auth', studentAuthRoutes);
app.use('/api/student/messages', studentMessagesRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin/students', adminStudentsRoutes);
app.use('/api/admin/student-messages', adminStudentMessagesRoutes);
```

- [ ] **Step 2: Verify server starts**

```bash
cd sahlearn-api
node -e "require('./src/app'); console.log('app OK')"
```

Expected: `app OK`

- [ ] **Step 3: Commit**

```bash
git add sahlearn-api/src/app.js
git commit -m "feat(messaging): mount student and admin message routes"
```

---

## Task 5: Frontend Services

**Files:**
- Create: `sahlearn-web/src/services/studentMessages.service.js`
- Create: `sahlearn-web/src/services/adminStudentMessages.service.js`

- [ ] **Step 1: Create student messages service**

```javascript
// sahlearn-web/src/services/studentMessages.service.js
import api from './api';

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('sahlearn_student_token')}`,
});

export const getMessages = async ({ page = 1, limit = 30 } = {}) => {
  const { data } = await api.get('/student/messages', {
    params: { page, limit },
    headers: authHeader(),
  });
  return data; // { status, data: messages[], meta }
};

export const sendMessage = async (content) => {
  const { data } = await api.post('/student/messages', { content }, { headers: authHeader() });
  return data.data;
};

export const getUnreadCount = async () => {
  const { data } = await api.get('/student/messages/unread-count', { headers: authHeader() });
  return data.data.count;
};
```

- [ ] **Step 2: Create admin student messages service**

```javascript
// sahlearn-web/src/services/adminStudentMessages.service.js
import api from './api';

export const listConversations = async () => {
  const { data } = await api.get('/admin/student-messages');
  return data.data; // array of conversation summaries
};

export const getConversation = async (studentId, { page = 1, limit = 50 } = {}) => {
  const { data } = await api.get(`/admin/student-messages/${studentId}`, {
    params: { page, limit },
  });
  return data.data; // { student, messages[], meta }
};

export const sendReply = async (studentId, content) => {
  const { data } = await api.post(`/admin/student-messages/${studentId}`, { content });
  return data.data;
};

export const getTotalUnread = async () => {
  const { data } = await api.get('/admin/student-messages/unread-count');
  return data.data.count;
};
```

- [ ] **Step 3: Commit**

```bash
git add sahlearn-web/src/services/studentMessages.service.js sahlearn-web/src/services/adminStudentMessages.service.js
git commit -m "feat(messaging): student and admin message services"
```

---

## Task 6: Student Messages Page

**Files:**
- Create: `sahlearn-web/src/pages/student/Messages.jsx`

The page shows the full conversation thread (student + admin messages) and a text input to send a new message. Polls every 15 seconds for new messages while the page is open.

- [ ] **Step 1: Create student Messages page**

```jsx
// sahlearn-web/src/pages/student/Messages.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { getMessages, sendMessage } from '../../services/studentMessages.service';
import { Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentMessages() {
  const { student } = useStudentAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollingRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getMessages({ limit: 100 });
      setMessages(res.data);
    } catch {
      if (!silent) toast.error('Failed to load messages');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    pollingRef.current = setInterval(() => load(true), 15000);
    return () => clearInterval(pollingRef.current);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setSending(true);
    try {
      const msg = await sendMessage(text);
      setMessages((prev) => [...prev, msg]);
      setContent('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const initials = student?.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-display text-ink-900 mb-4 flex-shrink-0">Messages</h1>

      {/* Thread */}
      <div className="flex-1 bg-white rounded-2xl border border-surface-200 overflow-y-auto p-4 space-y-3 min-h-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-ink-400 text-sm">No messages yet. Send a message to get started.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isStudent = msg.sender === 'student';
            return (
              <div key={msg._id} className={`flex gap-2.5 ${isStudent ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                {isStudent ? (
                  student?.avatar?.url ? (
                    <img src={student.avatar.url} alt={student.fullName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {initials}
                    </div>
                  )
                ) : (
                  <div className="w-8 h-8 rounded-full bg-ink-100 text-ink-500 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    AD
                  </div>
                )}

                {/* Bubble */}
                <div className={`max-w-[75%] ${isStudent ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isStudent
                        ? 'bg-brand-primary text-white rounded-tr-sm'
                        : 'bg-surface-100 text-ink-800 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-ink-300 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {new Date(msg.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          className="flex-1 px-4 py-3 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="px-4 py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add sahlearn-web/src/pages/student/Messages.jsx
git commit -m "feat(messaging): student Messages page with polling"
```

---

## Task 7: Admin Messaging Pages

**Files:**
- Create: `sahlearn-web/src/pages/admin/StudentConversations.jsx`
- Create: `sahlearn-web/src/pages/admin/StudentConversation.jsx`

- [ ] **Step 1: Create admin StudentConversations list page**

```jsx
// sahlearn-web/src/pages/admin/StudentConversations.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listConversations } from '../../services/adminStudentMessages.service';
import { MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentConversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listConversations()
      .then(setConversations)
      .catch(() => toast.error('Failed to load conversations'))
      .finally(() => setLoading(false));
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display text-ink-900">Student Messages</h1>
        {totalUnread > 0 && (
          <p className="text-sm text-brand-primary mt-0.5">{totalUnread} unread message{totalUnread !== 1 ? 's' : ''}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-12 text-center">
            <MessageCircle size={36} className="mx-auto text-ink-300 mb-2" />
            <p className="text-sm text-ink-400">No student messages yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {conversations.map((c) => {
              const initials = c.studentName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
              return (
                <Link
                  key={c.studentId}
                  to={`/admin/student-messages/${c.studentId}`}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-50 transition"
                >
                  {c.studentAvatar?.url ? (
                    <img src={c.studentAvatar.url} alt={c.studentName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${c.unreadCount > 0 ? 'text-ink-900' : 'text-ink-700'}`}>
                        {c.studentName}
                      </p>
                      <span className="text-[11px] text-ink-400 flex-shrink-0">
                        {c.lastMessage?.createdAt
                          ? new Date(c.lastMessage.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
                          : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate ${c.unreadCount > 0 ? 'text-ink-700 font-medium' : 'text-ink-400'}`}>
                        {c.lastMessage?.sender === 'admin' ? 'You: ' : ''}
                        {c.lastMessage?.content || ''}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-primary text-white text-[10px] font-bold flex items-center justify-center">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create admin StudentConversation detail page**

```jsx
// sahlearn-web/src/pages/admin/StudentConversation.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getConversation, sendReply } from '../../services/adminStudentMessages.service';
import { ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentConversation() {
  const { studentId } = useParams();
  const [data, setData] = useState(null); // { student, messages[], meta }
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const pollingRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getConversation(studentId, { limit: 100 });
      setData(res);
    } catch {
      if (!silent) toast.error('Failed to load conversation');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
    pollingRef.current = setInterval(() => load(true), 15000);
    return () => clearInterval(pollingRef.current);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setSending(true);
    try {
      const msg = await sendReply(studentId, text);
      setData((prev) => prev ? { ...prev, messages: [...prev.messages, msg] } : prev);
      setContent('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-ink-500">
        Conversation not found.{' '}
        <Link to="/admin/student-messages" className="text-brand-primary hover:underline">Back</Link>
      </div>
    );
  }

  const { student, messages } = data;
  const initials = student.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <Link to="/admin/student-messages" className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-900 transition">
          <ArrowLeft size={14} />
        </Link>
        {student.avatar?.url ? (
          <img src={student.avatar.url} alt={student.fullName} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-sm font-bold">
            {initials}
          </div>
        )}
        <div>
          <p className="font-semibold text-ink-900 leading-none">{student.fullName}</p>
          <p className="text-xs text-ink-400 font-mono">{student.studentId}</p>
        </div>
        <Link to={`/admin/students/${student.id}`} className="ml-auto text-xs text-brand-primary hover:underline">View profile</Link>
      </div>

      {/* Thread */}
      <div className="flex-1 bg-white rounded-2xl border border-surface-200 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-ink-400">No messages yet. Send the first message below.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender === 'admin';
            return (
              <div key={msg._id} className={`flex gap-2.5 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${isAdmin ? 'bg-ink-900 text-white' : 'bg-brand-primary/10 text-brand-primary'}`}>
                  {isAdmin ? 'AD' : initials}
                </div>
                <div className={`max-w-[75%] flex flex-col gap-0.5 ${isAdmin ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isAdmin ? 'bg-ink-900 text-white rounded-tr-sm' : 'bg-surface-100 text-ink-800 rounded-tl-sm'}`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-ink-300 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}
                    {new Date(msg.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Reply to ${student.fullName}...`}
          maxLength={2000}
          className="flex-1 px-4 py-3 border border-surface-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="px-4 py-3 bg-brand-primary text-white rounded-xl hover:bg-brand-primary/90 transition disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add sahlearn-web/src/pages/admin/StudentConversations.jsx sahlearn-web/src/pages/admin/StudentConversation.jsx
git commit -m "feat(messaging): admin StudentConversations and StudentConversation pages"
```

---

## Task 8: Wire Routes + Update Sidebars

**Files:**
- Modify: `sahlearn-web/src/routes/AppRouter.jsx`
- Modify: `sahlearn-web/src/components/layout/StudentLayout.jsx`
- Modify: `sahlearn-web/src/components/layout/AdminLayout.jsx`

### 8A — AppRouter.jsx

Add lazy imports after the existing student page imports:

```jsx
const StudentMessages = lazy(() => import('../pages/student/Messages'));
const AdminStudentConversations = lazy(() => import('../pages/admin/StudentConversations'));
const AdminStudentConversation = lazy(() => import('../pages/admin/StudentConversation'));
```

Inside the student portal `<Route path="/student" ...>` block, add:

```jsx
<Route path="messages" element={<StudentMessages />} />
```

Inside the admin `<Route path="/admin" ...>` block, add:

```jsx
<Route path="student-messages" element={<AdminStudentConversations />} />
<Route path="student-messages/:studentId" element={<AdminStudentConversation />} />
```

### 8B — StudentLayout.jsx

Add `MessageCircle` to the lucide-react import:

```jsx
import { LayoutDashboard, BookOpen, User, LogOut, Sprout, MessageCircle } from 'lucide-react';
```

Add Messages to `NAV_ITEMS`:

```jsx
const NAV_ITEMS = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/courses', label: 'My Courses', icon: BookOpen },
  { to: '/student/messages', label: 'Messages', icon: MessageCircle },
  { to: '/student/profile', label: 'Profile', icon: User },
];
```

Also remove the unused `useState` import (it was imported but not used in the original):

```jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { LayoutDashboard, BookOpen, User, LogOut, Sprout, MessageCircle } from 'lucide-react';
```

### 8C — AdminLayout.jsx

`MessageCircle` is not yet imported. Add it to the lucide-react import line:

```jsx
import {
  LayoutDashboard, BookOpen, FileText,
  MessageSquare, Users, UserCog,
  LogOut, Sprout, Bell, GraduationCap, MessageCircle,
} from 'lucide-react';
```

Add to `SIDEBAR_MANAGE`:

```jsx
const SIDEBAR_MANAGE = [
  { to: '/admin/messages', label: 'Messages', icon: MessageSquare },
  { to: '/admin/enrollments', label: 'Enrollments', icon: Users },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/student-messages', label: 'Student Messages', icon: MessageCircle },
  { to: '/admin/team', label: 'Team', icon: UserCog },
];
```

Add to `PAGE_TITLES`:

```javascript
'/admin/student-messages': 'Student Messages',
```

- [ ] **Step 1: Apply all three file changes described above**

- [ ] **Step 2: Commit**

```bash
git add sahlearn-web/src/routes/AppRouter.jsx sahlearn-web/src/components/layout/StudentLayout.jsx sahlearn-web/src/components/layout/AdminLayout.jsx
git commit -m "feat(messaging): wire messaging routes and update both sidebars"
```

---

## End-to-End Verification

After all tasks complete, test this flow manually:

**1. Student sends message:**
- Log in at `/student/login`
- Navigate to `/student/messages`
- Type and send a message
- Confirm message appears in thread

**2. Admin views and replies:**
- Log in at `/admin`
- Navigate to `/admin/student-messages`
- Confirm student appears in list with unread badge
- Open conversation, send reply

**3. Student sees admin reply:**
- Refresh or wait 15s for poll
- Admin reply appears in thread

**4. Unread counts clear:**
- After admin opens conversation, unread count resets to 0
- After student views conversation, admin reply marked read
