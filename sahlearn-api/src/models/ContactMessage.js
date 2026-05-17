const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/, 'Invalid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^(\+234|0)[789][01]\d{8}$/, 'Invalid Nigerian phone number'],
    },
    subject: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    message: { type: String, required: true, minlength: 10, maxlength: 2000 },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new',
      index: true,
    },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

contactMessageSchema.index({ status: 1, createdAt: -1 });

contactMessageSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
