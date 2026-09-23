// sahlearn-api/src/models/DailyQuizAttempt.js
const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    // mcq answers
    selectedIndex: { type: Number },
    // essay answers
    text: { type: String, maxlength: 2000 },
    // What this answer is worth so far. mcq answers are settled at submit;
    // an essay stays null until the admin marks it.
    awardedPoints: { type: Number, default: null },
    // Distinguishes "marked zero" from "not marked yet" — awardedPoints alone
    // cannot, since a wrong mcq and an unmarked essay both read as falsy.
    graded: { type: Boolean, default: false },
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
    // Points awarded SO FAR. On a quiz with essays this climbs as the admin
    // marks, so the leaderboard reflects grading progress rather than waiting
    // for it.
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    // Essay answers still waiting on the admin. 0 means fully marked, which is
    // every mcq-only attempt from the moment it is submitted.
    pendingEssays: { type: Number, default: 0 },
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
