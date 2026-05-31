const CATEGORIES = ['Design', 'Office', 'AI', 'Marketing', 'General'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const COURSE_STATUSES = ['published', 'draft'];
const POST_STATUSES = ['draft', 'published'];
const CONTACT_STATUSES = ['new', 'read', 'replied', 'archived'];
const ENROLLMENT_STATUSES = ['pending', 'contacted', 'enrolled', 'rejected'];
const ENROLLMENT_MODES = ['online', 'physical', 'hybrid'];
const PAYMENT_METHODS = ['bank_transfer', 'cash', 'free'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed'];
const RESERVED_SLUGS = ['admin', 'api', 'login', 'new', 'edit', 'sitemap', 'robots'];
const NIGERIAN_PHONE_RE = /^(\+234|0)[789][01]\d{8}$/;

module.exports = {
  CATEGORIES,
  LEVELS,
  COURSE_STATUSES,
  POST_STATUSES,
  CONTACT_STATUSES,
  ENROLLMENT_STATUSES,
  ENROLLMENT_MODES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  RESERVED_SLUGS,
  NIGERIAN_PHONE_RE,
};
