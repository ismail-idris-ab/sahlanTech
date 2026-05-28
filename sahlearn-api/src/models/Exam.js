// sahlearn-api/src/models/Exam.js
const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    type: { type: String, enum: ['mcq', 'short'], required: true },
    options: {
      type: [String],
      validate: {
        validator(v) {
          if (this.type === 'mcq') return v && v.length >= 2 && v.length <= 4;
          return true;
        },
        message: 'MCQ questions must have 2–4 options',
      },
    },
    correctIndex: {
      type: Number,
      validate: {
        validator(v) {
          if (this.type === 'mcq') return v !== null && v !== undefined;
          return true;
        },
        message: 'MCQ questions must have a correctIndex',
      },
    },
    points: { type: Number, default: 1, min: 1 },
  },
  { _id: true }
);

const examSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    duration: { type: Number, min: 1 },
    dueDate: { type: Date },
    isPublished: { type: Boolean, default: true },
    questions: { type: [questionSchema], default: [] },
    totalPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

examSchema.index({ course: 1, createdAt: -1 });

examSchema.pre('save', function () {
  this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
});

examSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Exam', examSchema);
