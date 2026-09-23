// sahlearn-api/src/models/DailyQuiz.js
const mongoose = require('mongoose');

// Two kinds of question, unlike Exam's schema:
//   mcq   — auto-scored the moment the student submits.
//   essay — stored unscored and marked by the admin later.
// An mcq-only quiz therefore still behaves exactly as it always has: the score
// reaches the student dashboard with no admin grading at all.
const isMcq = function () {
  return this.type !== 'essay';
};

const questionSchema = new mongoose.Schema(
  {
    // Defaulted rather than required so quizzes written before essay support
    // read back as mcq with no migration.
    type: { type: String, enum: ['mcq', 'essay'], default: 'mcq' },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    options: {
      type: [String],
      required: isMcq,
      validate: [
        {
          validator(v) {
            if (!isMcq.call(this)) return true; // essays carry no options
            return Array.isArray(v) && v.length >= 2 && v.length <= 4;
          },
          message: 'Each question must have between 2 and 4 options',
        },
        {
          validator(v) {
            if (!isMcq.call(this)) return true;
            return v.every((o) => typeof o === 'string' && o.trim().length > 0);
          },
          message: 'Options cannot be blank',
        },
      ],
    },
    correctIndex: {
      type: Number,
      required: isMcq,
      validate: {
        validator(v) {
          if (!isMcq.call(this)) return v == null; // an essay has no correct answer
          return Number.isInteger(v) && v >= 0 && v < (this.options?.length || 0);
        },
        message: 'correctIndex must point at one of the options',
      },
    },
    points: { type: Number, default: 1, min: 1 },
  },
  { _id: true }
);

// An essay reaching the database with leftover options or a correctIndex would
// make it look auto-scorable to every consumer downstream. Strip them here, at
// the one point every write passes through.
questionSchema.pre('validate', function () {
  if (this.type === 'essay') {
    this.options = [];
    this.correctIndex = undefined;
  }
});

const dailyQuizSchema = new mongoose.Schema(
  {
    date: {
      type: String, // 'YYYY-MM-DD' in Africa/Lagos
      required: true,
      unique: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'],
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (v) => v.length >= 1 && v.length <= 10,
        message: 'A daily quiz must have between 1 and 10 questions',
      },
    },
    totalPoints: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

dailyQuizSchema.pre('validate', function () {
  this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
});

dailyQuizSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('DailyQuiz', dailyQuizSchema);
