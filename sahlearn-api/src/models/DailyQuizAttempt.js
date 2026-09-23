// sahlearn-api/src/models/DailyQuizAttempt.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedIndex: { type: Number },
  },
  { _id: false }
);

const dailyQuizAttemptSchema = new mongoose.Schema(
  {
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyQuiz', required: true },
    // Denormalized from quiz.date so leaderboard and history queries never join.
    quizDate: { type: String, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    answers: { type: [answerSchema], default: [] },
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    startedAt: { type: Date, required: true },
    submittedAt: { type: Date },
    durationMs: { type: Number },
    status: { type: String, enum: ['in_progress', 'submitted'], default: 'in_progress' },
    // false = the student proved only their ID, no password. Flipping the access
    // model later sets this true without a migration.
    verified: { type: Boolean, default: false },
    ipHash: { type: String },
  },
  { timestamps: true }
);

dailyQuizAttemptSchema.index({ quizDate: 1, student: 1 }, { unique: true });
dailyQuizAttemptSchema.index({ quizDate: 1, score: -1, durationMs: 1 });
dailyQuizAttemptSchema.index({ student: 1, quizDate: -1 });

dailyQuizAttemptSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.ipHash;
    return ret;
  },
});

module.exports = mongoose.model('DailyQuizAttempt', dailyQuizAttemptSchema);
