const Post = require('../models/Post');
const cloudinary = require('../config/cloudinary');
const { success, successList, notFound } = require('../utils/apiResponse');
const { ensureUniqueSlug } = require('../utils/slugify');

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const calcReadTime = (content) => {
  const words = content.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

// GET /api/posts
const list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { status: 'published' };

  if (req.query.category) filter.category = req.query.category;
  if (req.query.featured === 'true') filter.isFeatured = true;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const [data, total] = await Promise.all([
    Post.find(filter)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content -createdBy'),
    Post.countDocuments(filter),
  ]);

  successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
};

// GET /api/posts/:slug
const getBySlug = async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug, status: 'published' }).select('-createdBy');
  if (!post) return notFound(res, 'Post not found');

  post.views += 1;
  await post.save();

  success(res, post);
};

// GET /api/admin/posts
const adminList = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const [data, total] = await Promise.all([
    Post.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).select('-content'),
    Post.countDocuments(filter),
  ]);

  successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
};

// GET /api/admin/posts/:id
const adminGetById = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return notFound(res, 'Post not found');
  success(res, post);
};

// POST /api/posts
const create = async (req, res) => {
  const slug = await ensureUniqueSlug(Post, req.body.slug || req.body.title);
  const readTimeMinutes = calcReadTime(req.body.content || '');
  const publishedAt = req.body.status === 'published' ? new Date() : undefined;

  const post = await Post.create({
    ...req.body,
    slug,
    readTimeMinutes,
    publishedAt,
    createdBy: req.user._id,
  });

  success(res, post, 201);
};

// PATCH /api/posts/:id
const update = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return notFound(res, 'Post not found');

  if (req.body.slug && req.body.slug !== post.slug) {
    req.body.slug = await ensureUniqueSlug(Post, req.body.slug, post._id);
  }

  if (req.body.content) {
    req.body.readTimeMinutes = calcReadTime(req.body.content);
  }

  // Set publishedAt on first publish transition
  if (req.body.status === 'published' && post.status !== 'published' && !post.publishedAt) {
    req.body.publishedAt = new Date();
  }

  Object.assign(post, req.body);
  await post.save();
  success(res, post);
};

// DELETE /api/posts/:id
const remove = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return notFound(res, 'Post not found');

  if (post.coverImage?.public_id) {
    cloudinary.uploader.destroy(post.coverImage.public_id).catch((e) =>
      console.error('Cloudinary destroy failed:', e.message)
    );
  }

  await post.deleteOne();
  success(res, { id: req.params.id });
};

module.exports = { list, getBySlug, adminList, adminGetById, create, update, remove };
