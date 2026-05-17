const { body } = require('express-validator');
const { CATEGORIES, LEVELS } = require('../utils/constants');

const courseCreateValidator = [
  body('title').trim().isLength({ min: 3, max: 150 }).withMessage('Title must be 3–150 chars'),
  body('slug')
    .optional()
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must be lowercase alphanumeric with hyphens'),
  body('shortDescription')
    .trim()
    .isLength({ min: 10, max: 300 })
    .withMessage('Short description must be 10–300 chars'),
  body('description')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Description must be at least 50 chars'),
  body('category').trim().isIn(CATEGORIES).withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),
  body('level').isIn(LEVELS).withMessage(`Level must be one of: ${LEVELS.join(', ')}`),
  body('duration').trim().notEmpty().withMessage('Duration required'),
  body('price').trim().notEmpty().withMessage('Price required'),
  body('whatYouLearn').optional().isArray().withMessage('whatYouLearn must be an array'),
  body('prerequisites').optional().isArray().withMessage('prerequisites must be an array'),
  body('isPublished').optional().isBoolean(),
  body('isFeatured').optional().isBoolean(),
  body('seoTitle').optional().trim().isLength({ max: 70 }),
  body('seoDescription').optional().trim().isLength({ max: 160 }),
];

const courseUpdateValidator = [
  body('title').optional().trim().isLength({ min: 3, max: 150 }).withMessage('Title must be 3–150 chars'),
  body('slug')
    .optional()
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must be lowercase alphanumeric with hyphens'),
  body('shortDescription').optional().trim().isLength({ min: 10, max: 300 }),
  body('description').optional().trim().isLength({ min: 50 }),
  body('category').optional().trim().isIn(CATEGORIES),
  body('level').optional().isIn(LEVELS),
  body('duration').optional().trim().notEmpty(),
  body('price').optional().trim().notEmpty(),
  body('whatYouLearn').optional().isArray(),
  body('prerequisites').optional().isArray(),
  body('isPublished').optional().isBoolean(),
  body('isFeatured').optional().isBoolean(),
  body('seoTitle').optional().trim().isLength({ max: 70 }),
  body('seoDescription').optional().trim().isLength({ max: 160 }),
];

module.exports = { courseCreateValidator, courseUpdateValidator };
