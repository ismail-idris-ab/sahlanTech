// sahlearn-api/src/controllers/admin.assignments.controller.js
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const cloudinary = require('../config/cloudinary');
const { success, successList, notFound } = require('../utils/apiResponse');

const createAssignment = async (req, res) => {
  const { course, isGeneral, title, description, dueDate, enrollmentCutoff, isPublished, totalPoints } = req.body;

  const assignment = await Assignment.create({
    course: isGeneral ? null : course,
    isGeneral: !!isGeneral,
    title,
    description,
    dueDate: dueDate || undefined,
    enrollmentCutoff: enrollmentCutoff || undefined,
    isPublished: isPublished !== undefined ? isPublished : true,
    totalPoints: totalPoints || 100,
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
  const allowed = ['title', 'description', 'dueDate', 'enrollmentCutoff', 'isPublished', 'totalPoints'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (req.body.isGeneral !== undefined) {
    updates.isGeneral = !!req.body.isGeneral;
    updates.course = req.body.isGeneral ? null : (req.body.course || undefined);
  } else if (req.body.course !== undefined) {
    updates.course = req.body.course;
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
  const { score, feedback, status } = req.body;

  const submission = await Submission.findById(req.params.submissionId).populate('assignment', 'title totalPoints');
  if (!submission) return notFound(res, 'Submission not found');

  if (score !== undefined) {
    const maxPoints = submission.assignment?.totalPoints || 100;
    submission.score = Math.min(Math.max(0, Number(score) || 0), maxPoints);
    submission.maxScore = maxPoints;
    submission.gradedAt = new Date();
  }
  if (feedback !== undefined) submission.feedback = feedback;
  if (status !== undefined) submission.status = status;
  if ((score !== undefined || feedback) && !submission.gradedAt) submission.gradedAt = new Date();

  await submission.save();

  await submission.populate('student', 'fullName studentId email avatar');
  success(res, submission);
};

module.exports = { createAssignment, listAssignments, getAssignment, updateAssignment, deleteAssignment, listSubmissions, gradeSubmission };
