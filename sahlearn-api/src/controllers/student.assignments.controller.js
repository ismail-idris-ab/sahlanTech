// sahlearn-api/src/controllers/student.assignments.controller.js
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { success, successList, notFound } = require('../utils/apiResponse');

const listAssignments = async (req, res) => {
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
