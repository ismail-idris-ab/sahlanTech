const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { success, successList, notFound } = require('../utils/apiResponse');

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

// POST /api/enrollments
const create = async (req, res) => {
  const { course: courseId, courseTitleSnapshot } = req.body;

  let titleSnapshot = courseTitleSnapshot || 'General Inquiry';
  if (courseId) {
    const found = await Course.findById(courseId).select('title');
    if (found) titleSnapshot = found.title;
  }

  const enrollment = await Enrollment.create({
    ...req.body,
    courseTitleSnapshot: titleSnapshot,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  success(res, { id: enrollment._id }, 201);
};

// GET /api/enrollments
const list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.course) filter.course = req.query.course;

  const [data, total] = await Promise.all([
    Enrollment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('course', 'title slug'),
    Enrollment.countDocuments(filter),
  ]);

  successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
};

// PATCH /api/enrollments/:id
const update = async (req, res) => {
  const enrollment = await Enrollment.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  if (!enrollment) return notFound(res, 'Enrollment not found');
  success(res, enrollment);
};

// DELETE /api/enrollments/:id
const remove = async (req, res) => {
  const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
  if (!enrollment) return notFound(res, 'Enrollment not found');
  success(res, { id: req.params.id });
};

module.exports = { create, list, update, remove };
