// sahlearn-api/src/models/AttendanceRecord.js
const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'AttendanceSession', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'absent',
    },
  },
  { timestamps: true }
);

// One record per student per session
attendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });

attendanceRecordSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
