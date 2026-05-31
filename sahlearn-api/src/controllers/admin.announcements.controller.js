// sahlearn-api/src/controllers/admin.announcements.controller.js
const Announcement = require('../models/Announcement');
const cloudinary = require('../config/cloudinary');
const { success, successList, notFound } = require('../utils/apiResponse');

// Documents are stored as 'raw' on Cloudinary, images as 'image'.
const fileResourceType = (file) => (file.mimetype.startsWith('image/') ? 'image' : 'raw');

const buildFileMeta = (file) => ({
  url: file.path,
  public_id: file.filename,
  resource_type: fileResourceType(file),
  originalName: file.originalname,
  mimeType: file.mimetype,
  size: file.size,
});

const destroyFile = (fileDoc) =>
  cloudinary.uploader
    .destroy(fileDoc.public_id, { resource_type: fileDoc.resource_type || 'image' })
    .catch(() => {});

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

// POST /api/admin/announcements
const create = async (req, res) => {
  const { title, body, target, course, studentIds } = req.body;

  const announcement = await Announcement.create({
    title,
    body,
    target: target || 'all',
    course: target === 'course' ? course : null,
    studentIds: target === 'students' ? (JSON.parse(studentIds || '[]')) : [],
    file: req.file ? buildFileMeta(req.file) : undefined,
  });

  success(res, announcement, 201);
};

// GET /api/admin/announcements
const list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [announcements, total] = await Promise.all([
    Announcement.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('course', 'title')
      .lean(),
    Announcement.countDocuments(),
  ]);

  successList(res, announcements.map((a) => ({ ...a, id: a._id })), { page, limit, total, totalPages: Math.ceil(total / limit) });
};

// PATCH /api/admin/announcements/:id
const update = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return notFound(res, 'Announcement not found');

  const { title, body, target, course, studentIds, removeFile } = req.body;

  if (title !== undefined) announcement.title = title;
  if (body !== undefined) announcement.body = body;
  if (target !== undefined) {
    announcement.target = target;
    announcement.course = target === 'course' ? course || null : null;
    announcement.studentIds = target === 'students' ? JSON.parse(studentIds || '[]') : [];
  }

  // Replace file if new one uploaded
  if (req.file) {
    if (announcement.file?.public_id) {
      await destroyFile(announcement.file);
    }
    announcement.file = buildFileMeta(req.file);
  } else if (removeFile === 'true' && announcement.file?.public_id) {
    await destroyFile(announcement.file);
    announcement.file = undefined;
  }

  await announcement.save();
  success(res, announcement);
};

// DELETE /api/admin/announcements/:id
const remove = async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return notFound(res, 'Announcement not found');

  if (announcement.file?.public_id) {
    await destroyFile(announcement.file);
  }

  await announcement.deleteOne();
  success(res, { message: 'Announcement deleted' });
};

module.exports = { create, list, update, remove };
