const slugifyLib = require('slugify');
const { RESERVED_SLUGS } = require('./constants');

const makeSlug = (text) =>
  slugifyLib(text, { lower: true, strict: true, trim: true });

const ensureUniqueSlug = async (Model, base, excludeId = null) => {
  let slug = makeSlug(base);

  if (RESERVED_SLUGS.includes(slug)) {
    slug = `${slug}-course`;
  }

  let candidate = slug;
  let counter = 2;

  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Model.exists(query);
    if (!exists) return candidate;
    candidate = `${slug}-${counter++}`;
  }
};

module.exports = { makeSlug, ensureUniqueSlug };
