const { body } = require('express-validator');
const { POST_STATUSES } = require('../utils/constants');

const postCreateValidator = [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 chars'),
  body('slug')
    .optional()
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must be lowercase alphanumeric with hyphens'),
  body('excerpt').trim().isLength({ min: 10, max: 300 }).withMessage('Excerpt must be 10–300 chars'),
  body('content').trim().notEmpty().withMessage('Content required'),
  body('category').optional().trim().isLength({ max: 100 }),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Tags must be an array (max 10)'),
  body('tags.*').optional().trim().toLowerCase(),
  body('author').optional().trim().isLength({ max: 100 }),
  body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Status must be draft, published, or archived'),
  body('isFeatured').optional().isBoolean(),
  body('seoTitle').optional().trim().isLength({ max: 70 }),
  body('seoDescription').optional().trim().isLength({ max: 160 }),
];

const postUpdateValidator = [
  body('title').optional().trim().isLength({ min: 3, max: 200 }),
  body('slug')
    .optional()
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9-]+$/),
  body('excerpt').optional().trim().isLength({ min: 10, max: 300 }),
  body('content').optional().trim().notEmpty(),
  body('category').optional().trim().isLength({ max: 100 }),
  body('tags').optional().isArray({ max: 10 }),
  body('tags.*').optional().trim().toLowerCase(),
  body('author').optional().trim().isLength({ max: 100 }),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  body('isFeatured').optional().isBoolean(),
  body('seoTitle').optional().trim().isLength({ max: 70 }),
  body('seoDescription').optional().trim().isLength({ max: 160 }),
];

module.exports = { postCreateValidator, postUpdateValidator };
