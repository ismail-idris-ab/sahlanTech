const mongoose = require('mongoose');

const dailyCheckInSchema = new mongoose.Schema(
  {
    student:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    date:        { type: String, required: true }, // 'YYYY-MM-DD'
    checkedInAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

dailyCheckInSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyCheckIn', dailyCheckInSchema);
