// sahlearn-api/src/models/DailyQuiz.js
const mongoose = require('mongoose');

// MCQ only, unlike Exam's questionSchema — the daily quiz must be auto-scorable
// so the score can be written to the student dashboard with no admin grading.
const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    options: {
      type: [String],
      required: true,
      validate: [
        {
          validator: (v) => Array.isArray(v) && v.length >= 2 && v.length <= 4,
          message: 'Each question must have between 2 and 4 options',
        },
        {
          validator: (v) => v.every((o) => typeof o === 'string' && o.trim().length > 0),
          message: 'Options cannot be blank',
        },
      ],
    },
    correctIndex: {
      type: Number,
      required: true,
      validate: {
        validator(v) {
          return Number.isInteger(v) && v >= 0 && v < (this.options?.length || 0);
        },
        message: 'correctIndex must point at one of the options',
      },
    },
    points: { type: Number, default: 1, min: 1 },
  },
  { _id: true }
);

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
