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
    // Optional since the quiz is open to anyone: set only when the taker gave a
    // student ID, which is what routes the score to their dashboard.
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    // Who took it, registered or not. `phoneKey` is the canonical form from
    // utils/phone and is the identity the whole feature keys on — `phone` keeps
    // whatever they actually typed, for the admin to read.
    participant: {
      fullName: { type: String, trim: true, maxlength: 100 },
      phone: { type: String, trim: true },
      phoneKey: { type: String },
    },
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

// One attempt per phone per day. This is THE uniqueness rule now that anyone
// can take the quiz — every attempt has a phone, registered or not.
//
// Both unique indexes must be partial. A plain unique index treats every
// missing value as the same value, so a second guest on the same day (student
// null) or a legacy row with no phone would be rejected as a duplicate of the
// first. `partialFilterExpression` limits each index to the rows that actually
// carry the field.
//
// These replace an earlier plain unique index on { quizDate, student }. An
// existing database still has that old index and Mongoose will not rewrite it —
// see src/migrations/2026-09-23-open-quiz-indexes.js, which must be run once
// before deploying this.
dailyQuizAttemptSchema.index(
  { quizDate: 1, 'participant.phoneKey': 1 },
  { unique: true, partialFilterExpression: { 'participant.phoneKey': { $type: 'string' } } }
);
dailyQuizAttemptSchema.index(
  { quizDate: 1, student: 1 },
  { unique: true, partialFilterExpression: { student: { $type: 'objectId' } } }
);
dailyQuizAttemptSchema.index({ quizDate: 1, score: -1, durationMs: 1 });
dailyQuizAttemptSchema.index({ student: 1, quizDate: -1 });
// Backs the "check my past scores" lookup.
dailyQuizAttemptSchema.index({ 'participant.phoneKey': 1, quizDate: -1 });

dailyQuizAttemptSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.ipHash;
    // phoneKey is the full number in another form. Public payloads are built
    // field by field elsewhere; this stops it riding along if an attempt is
    // ever serialized whole.
    if (ret.participant) delete ret.participant.phoneKey;
    return ret;
  },
});

module.exports = mongoose.model('DailyQuizAttempt', dailyQuizAttemptSchema);
