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
