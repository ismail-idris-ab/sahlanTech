// sahlearn-api/src/controllers/admin.attendance.controller.js
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Student = require('../models/Student');
const { success, successList, notFound } = require('../utils/apiResponse');

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

// POST /api/admin/attendance/sessions
const createSession = async (req, res) => {
  const { course, label, date, note } = req.body;
  const session = await AttendanceSession.create({ course, label, date, note });
  success(res, session, 201);
};

// GET /api/admin/attendance/sessions
const listSessions = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.course) filter.course = req.query.course;

  const [sessions, total] = await Promise.all([
    AttendanceSession.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .populate('course', 'title slug')
      .lean(),
    AttendanceSession.countDocuments(filter),
  ]);

  // Attach record counts per session
  const sessionIds = sessions.map((s) => s._id);
  const counts = await AttendanceRecord.aggregate([
    { $match: { session: { $in: sessionIds } } },
    { $group: { _id: '$session', total: { $sum: 1 }, present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c]));

  const data = sessions.map((s) => ({
    ...s,
    id: s._id,
    recordCount: countMap[s._id.toString()]?.total || 0,
    presentCount: countMap[s._id.toString()]?.present || 0,
  }));

  successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
};

// GET /api/admin/attendance/sessions/:id
const getSession = async (req, res) => {
  const session = await AttendanceSession.findById(req.params.id).populate('course', 'title slug').lean();
  if (!session) return notFound(res, 'Session not found');

  // Get enrolled students for this course
  const students = await Student.find({ 'enrolledCourses.course': session.course._id, isActive: true })
    .select('fullName studentId avatar')
    .lean();

  // Get existing records for this session
  const records = await AttendanceRecord.find({ session: session._id }).lean();
  const recordMap = Object.fromEntries(records.map((r) => [r.student.toString(), r.status]));

  const roster = students.map((s) => ({
    studentId: s._id,
    fullName: s.fullName,
    studentCode: s.studentId,
    avatar: s.avatar,
    status: recordMap[s._id.toString()] || 'absent',
  }));

  success(res, { session: { ...session, id: session._id }, roster });
};

// PATCH /api/admin/attendance/sessions/:id
const updateSession = async (req, res) => {
  const session = await AttendanceSession.findById(req.params.id);
  if (!session) return notFound(res, 'Session not found');

  const allowed = ['label', 'date', 'note'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) session[key] = req.body[key];
  }
  await session.save();
  success(res, session);
};

// DELETE /api/admin/attendance/sessions/:id
const deleteSession = async (req, res) => {
  const session = await AttendanceSession.findById(req.params.id);
  if (!session) return notFound(res, 'Session not found');

  await Promise.all([
    session.deleteOne(),
    AttendanceRecord.deleteMany({ session: session._id }),
  ]);
  success(res, { message: 'Session deleted' });
};

// PUT /api/admin/attendance/sessions/:id/records
// Body: { records: [{ studentId, status }] }
const saveRecords = async (req, res) => {
  const session = await AttendanceSession.findById(req.params.id);
  if (!session) return notFound(res, 'Session not found');

  const { records } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ status: 'error', message: 'records array required' });
  }

  const validStatuses = ['present', 'absent', 'late', 'excused'];

  const ops = records
    .filter((r) => r.studentId && validStatuses.includes(r.status))
    .map((r) => ({
      updateOne: {
        filter: { session: session._id, student: r.studentId },
        update: { $set: { status: r.status } },
        upsert: true,
      },
    }));

  if (ops.length > 0) await AttendanceRecord.bulkWrite(ops);

  success(res, { saved: ops.length });
};

// GET /api/admin/students/:id/attendance — summary for one student across all courses
const getStudentAttendance = async (req, res) => {
  const student = await Student.findById(req.params.id).select('enrolledCourses').populate('enrolledCourses.course', 'title');
  if (!student) return notFound(res, 'Student not found');

  const courseIds = student.enrolledCourses.filter((ec) => ec.course).map((ec) => ec.course._id);

  // All sessions for enrolled courses
  const sessions = await AttendanceSession.find({ course: { $in: courseIds } }).populate('course', 'title').lean();
  const sessionIds = sessions.map((s) => s._id);

  // Student's records
  const records = await AttendanceRecord.find({ session: { $in: sessionIds }, student: req.params.id }).lean();
  const recordMap = Object.fromEntries(records.map((r) => [r.session.toString(), r.status]));

  // Group by course
  const courseMap = {};
  for (const s of sessions) {
    const cid = s.course._id.toString();
    if (!courseMap[cid]) courseMap[cid] = { courseId: cid, courseTitle: s.course.title, sessions: [] };
    courseMap[cid].sessions.push({
      sessionId: s._id,
      label: s.label,
      date: s.date,
      status: recordMap[s._id.toString()] || 'absent',
    });
  }

  const data = Object.values(courseMap).map((group) => {
    const total = group.sessions.length;
    const attended = group.sessions.filter((s) => s.status === 'present' || s.status === 'late').length;
    return { ...group, total, attended, percentage: total > 0 ? Math.round((attended / total) * 100) : null };
  });

  success(res, data);
};

module.exports = { createSession, listSessions, getSession, updateSession, deleteSession, saveRecords, getStudentAttendance };
