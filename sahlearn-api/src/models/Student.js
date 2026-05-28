const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const enrolledCourseSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
    enrolledAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, unique: true, required: true },
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/, 'Invalid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^(\+234|0)[789][01]\d{8}$/, 'Invalid Nigerian phone number'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    avatar: { url: String, public_id: String },
    dateOfBirth: Date,
    address: { type: String, trim: true },
    bio: { type: String, maxlength: 300 },
    enrolledCourses: [enrolledCourseSchema],
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    tempPassword: { type: String },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);


studentSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

studentSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

studentSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    return ret;
  },
});

module.exports = mongoose.model('Student', studentSchema);
