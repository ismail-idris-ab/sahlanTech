const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Invalid slug'],
    },
    excerpt: { type: String, required: true, trim: true, minlength: 10, maxlength: 300 },
    content: { type: String, required: true },
    coverImage: { url: String, public_id: String },
    category: { type: String, default: 'General', trim: true, index: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    author: { type: String, default: 'Sahlearn' },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    isFeatured: { type: Boolean, default: false },
    publishedAt: Date,
    readTimeMinutes: Number,
    views: { type: Number, default: 0 },
    seoTitle: { type: String, maxlength: 70 },
    seoDescription: { type: String, maxlength: 160 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });

postSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Post', postSchema);
