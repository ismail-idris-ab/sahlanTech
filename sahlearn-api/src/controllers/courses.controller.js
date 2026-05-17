const Course = require('../models/Course');
const cloudinary = require('../config/cloudinary');
const { success, successList, notFound } = require('../utils/apiResponse');
const { ensureUniqueSlug } = require('../utils/slugify');

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

// GET /api/courses
const list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { isPublished: true };

  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const [data, total] = await Promise.all([
    Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-createdBy'),
    Course.countDocuments(filter),
  ]);

  successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
};

// GET /api/courses/:slug
const getBySlug = async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, isPublished: true }).select('-createdBy');
  if (!course) return notFound(res, 'Course not found');
  success(res, course);
};

// GET /api/admin/courses
const adminList = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.status === 'published') filter.isPublished = true;
  if (req.query.status === 'draft') filter.isPublished = false;

  const [data, total] = await Promise.all([
    Course.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Course.countDocuments(filter),
  ]);

  successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
};

// GET /api/admin/courses/:id
const adminGetById = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return notFound(res, 'Course not found');
  success(res, course);
};

// POST /api/courses
const create = async (req, res) => {
  const slug = await ensureUniqueSlug(Course, req.body.slug || req.body.title);
  const course = await Course.create({ ...req.body, slug, createdBy: req.user._id });
  success(res, course, 201);
};

// PATCH /api/courses/:id
const update = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return notFound(res, 'Course not found');

  if (req.body.slug && req.body.slug !== course.slug) {
    req.body.slug = await ensureUniqueSlug(Course, req.body.slug, course._id);
  }

  Object.assign(course, req.body);
  await course.save();
  success(res, course);
};

// DELETE /api/courses/:id
const remove = async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return notFound(res, 'Course not found');

  if (course.coverImage?.public_id) {
    cloudinary.uploader.destroy(course.coverImage.public_id).catch((e) =>
      console.error('Cloudinary destroy failed:', e.message)
    );
  }

  await course.deleteOne();
  success(res, { id: req.params.id });
};

module.exports = { list, getBySlug, adminList, adminGetById, create, update, remove };
