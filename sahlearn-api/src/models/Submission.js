// sahlearn-api/src/models/Submission.js
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    file: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
      originalName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
    },
    note: { type: String, trim: true, maxlength: 1000 },
    grade: { type: String, trim: true, maxlength: 20 },
    feedback: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date },
  },
  { timestamps: true }
);

// One submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
