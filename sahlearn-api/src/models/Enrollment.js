const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/, 'Invalid email'],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^(\+234|0)[789][01]\d{8}$/, 'Invalid Nigerian phone number'],
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    courseTitleSnapshot: { type: String, required: true },
    preferredStartDate: Date,
    mode: { type: String, enum: ['online', 'physical', 'hybrid'], default: 'online' },
    notes: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'enrolled', 'rejected'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['paystack', 'bank_transfer', 'free'],
      default: 'bank_transfer',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentRef: { type: String, trim: true },
    amountPaid: { type: Number, default: 0 },
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

enrollmentSchema.index({ status: 1, createdAt: -1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ email: 1 });

enrollmentSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
