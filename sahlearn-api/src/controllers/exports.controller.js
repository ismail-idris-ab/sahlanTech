// sahlearn-api/src/controllers/exports.controller.js
const Student = require('../models/Student');
const ExamAttempt = require('../models/ExamAttempt');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const Assignment = require('../models/Assignment');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const { notFound } = require('../utils/apiResponse');
const { generateReportCard, generateAttendanceRegister, sendCSV } = require('../utils/pdf');

// GET /api/admin/exports/students/:id/report.pdf
const studentReportCard = async (req, res) => {
  const student = await Student.findById(req.params.id)
    .select('-password -passwordResetToken -passwordResetExpires')
    .populate('enrolledCourses.course', 'title');
  if (!student) return notFound(res, 'Student not found');

  const studentId = student._id;

  // Progress
  const [attempts, submissions] = await Promise.all([
    ExamAttempt.find({ student: studentId })
      .populate({ path: 'exam', select: 'title totalPoints course', populate: { path: 'course', select: 'title _id' } })
      .lean(),
    Submission.find({ student: studentId })
      .populate({ path: 'assignment', select: 'title totalPoints course', populate: { path: 'course', select: 'title _id' } })
      .lean(),
  ]);

  const courseMap = {};
  const ensureCourse = (courseDoc) => {
    if (!courseDoc) return null;
    const id = courseDoc._id.toString();
    if (!courseMap[id]) courseMap[id] = { courseTitle: courseDoc.title, exams: [], assignments: [] };
    return id;
  };

  for (const a of attempts) {
    const id = ensureCourse(a.exam?.course);
    if (id) courseMap[id].exams.push({ title: a.exam?.title, score: a.score, maxScore: a.maxScore, status: a.status });
  }
  for (const s of submissions) {
    const id = ensureCourse(s.assignment?.course);
    if (id) courseMap[id].assignments.push({ title: s.assignment?.title, score: s.score, maxScore: s.maxScore || s.assignment?.totalPoints || 100, status: s.status });
  }
  const progress = Object.values(courseMap);

  // Attendance
  const courseIds = student.enrolledCourses.filter((ec) => ec.course).map((ec) => ec.course._id);
  const sessions = await AttendanceSession.find({ course: { $in: courseIds } }).populate('course', 'title').lean();
  const records = await AttendanceRecord.find({ session: { $in: sessions.map((s) => s._id) }, student: studentId }).lean();
  const recordMap = Object.fromEntries(records.map((r) => [r.session.toString(), r.status]));

  const attMap = {};
  for (const s of sessions) {
    const cid = s.course._id.toString();
    if (!attMap[cid]) attMap[cid] = { courseTitle: s.course.title, total: 0, attended: 0 };
    attMap[cid].total++;
    const status = recordMap[s._id.toString()];
    if (status === 'present' || status === 'late') attMap[cid].attended++;
  }
  const attendance = Object.values(attMap).map((a) => ({
    ...a,
    percentage: a.total > 0 ? Math.round((a.attended / a.total) * 100) : null,
  }));

  generateReportCard(res, { student: student.toJSON(), progress, attendance });
};

// GET /api/admin/exports/attendance/:sessionId/register.pdf
const attendanceRegister = async (req, res) => {
  const session = await AttendanceSession.findById(req.params.sessionId).populate('course', 'title').lean();
  if (!session) return notFound(res, 'Session not found');

  const students = await Student.find({ 'enrolledCourses.course': session.course._id, isActive: true })
    .select('fullName studentId avatar').lean();

  const records = await AttendanceRecord.find({ session: session._id }).lean();
  const recordMap = Object.fromEntries(records.map((r) => [r.student.toString(), r.status]));

  const roster = students.map((s) => ({
    studentCode: s.studentId,
    fullName: s.fullName,
    status: recordMap[s._id.toString()] || 'absent',
  }));

  generateAttendanceRegister(res, { session: { ...session, id: session._id }, roster });
};

// GET /api/admin/exports/exams/:id/results.csv
const examResultsCSV = async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate('course', 'title').lean();
  if (!exam) return notFound(res, 'Exam not found');

  const attempts = await ExamAttempt.find({ exam: exam._id })
    .populate('student', 'fullName studentId email')
    .lean();

  const headers = ['Student ID', 'Full Name', 'Email', 'Score', 'Max Score', '%', 'Status', 'Submitted At'];
  const rows = attempts.map((a) => [
    a.student?.studentId,
    a.student?.fullName,
    a.student?.email,
    a.score,
    a.maxScore,
    a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : 0,
    a.status,
    a.submittedAt ? new Date(a.submittedAt).toLocaleDateString('en-NG') : '',
  ]);

  const filename = `${exam.title.replace(/[^a-z0-9]/gi, '-')}-results.csv`;
  sendCSV(res, filename, headers, rows);
};

// GET /api/admin/exports/assignments/:id/results.csv
const assignmentResultsCSV = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate('course', 'title').lean();
  if (!assignment) return notFound(res, 'Assignment not found');

  const submissions = await Submission.find({ assignment: assignment._id })
    .populate('student', 'fullName studentId email')
    .lean();

  const headers = ['Student ID', 'Full Name', 'Email', 'Score', 'Max Score', '%', 'Status', 'Submitted At'];
  const rows = submissions.map((s) => [
    s.student?.studentId,
    s.student?.fullName,
    s.student?.email,
    s.score ?? '',
    s.maxScore || assignment.totalPoints || 100,
    s.score != null && s.maxScore > 0 ? Math.round((s.score / s.maxScore) * 100) : '',
    s.status,
    s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('en-NG') : '',
  ]);

  const filename = `${assignment.title.replace(/[^a-z0-9]/gi, '-')}-results.csv`;
  sendCSV(res, filename, headers, rows);
};

module.exports = { studentReportCard, attendanceRegister, examResultsCSV, assignmentResultsCSV };
