const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Invalid slug'],
    },
    shortDescription: { type: String, required: true, trim: true, minlength: 10, maxlength: 300 },
    description: { type: String, required: true, minlength: 50 },
    coverImage: { url: String, public_id: String },
    category: { type: String, required: true, trim: true, index: true },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    duration: { type: String, required: true },
    price: { type: String, required: true },
    whatYouLearn: [String],
    prerequisites: [String],
    isPublished: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    videoUrl: { type: String, trim: true },
    seoTitle: { type: String, maxlength: 70 },
    seoDescription: { type: String, maxlength: 160 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

courseSchema.index({ isPublished: 1, createdAt: -1 });
courseSchema.index({ title: 'text', shortDescription: 'text' });

courseSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Course', courseSchema);
