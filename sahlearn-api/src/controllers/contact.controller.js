const ContactMessage = require('../models/ContactMessage');
const { success, successList, notFound } = require('../utils/apiResponse');

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

// POST /api/contact
const create = async (req, res) => {
  const message = await ContactMessage.create({
    ...req.body,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  success(res, { id: message._id }, 201);
};

// GET /api/contact
const list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [data, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ContactMessage.countDocuments(filter),
  ]);

  successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
};

// PATCH /api/contact/:id
const update = async (req, res) => {
  const message = await ContactMessage.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );
  if (!message) return notFound(res, 'Message not found');
  success(res, message);
};

// DELETE /api/contact/:id
const remove = async (req, res) => {
  const message = await ContactMessage.findByIdAndDelete(req.params.id);
  if (!message) return notFound(res, 'Message not found');
  success(res, { id: req.params.id });
};

module.exports = { create, list, update, remove };
