// sahlearn-api/src/models/ExamAttempt.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedIndex: { type: Number },
    textAnswer: { type: String, trim: true, maxlength: 2000 },
    // Points awarded by admin for short/essay answers
    essayScore: { type: Number, min: 0, default: null },
  },
  { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    answers: { type: [answerSchema], default: [] },
    mcqScore: { type: Number, default: 0 },  // auto-calculated at submission
    score: { type: Number, default: 0 },     // mcqScore + sum of essayScores
    maxScore: { type: Number, default: 0 },
    status: { type: String, enum: ['submitted', 'reviewed'], default: 'submitted' },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    adminNote: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

examAttemptSchema.index({ exam: 1, student: 1 }, { unique: true });

examAttemptSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
