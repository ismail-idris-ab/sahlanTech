// sahlearn-api/src/controllers/student.attendance.controller.js
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const { success } = require('../utils/apiResponse');

// GET /api/student/attendance
const getMyAttendance = async (req, res) => {
  const courseIds = req.student.enrolledCourses
    .filter((ec) => ec.course)
    .map((ec) => ec.course);

  const sessions = await AttendanceSession.find({ course: { $in: courseIds } })
    .populate('course', 'title slug')
    .sort({ date: -1 })
    .lean();

  const sessionIds = sessions.map((s) => s._id);
  const records = await AttendanceRecord.find({ session: { $in: sessionIds }, student: req.student._id }).lean();
  const recordMap = Object.fromEntries(records.map((r) => [r.session.toString(), r.status]));

  // Group by course
  const courseMap = {};
  for (const s of sessions) {
    const cid = s.course._id.toString();
    if (!courseMap[cid]) {
      courseMap[cid] = { courseId: cid, courseTitle: s.course.title, sessions: [] };
    }
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
    return {
      ...group,
      total,
      attended,
      percentage: total > 0 ? Math.round((attended / total) * 100) : null,
    };
  });

  success(res, data);
};

module.exports = { getMyAttendance };
