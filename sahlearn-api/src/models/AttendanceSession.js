// sahlearn-api/src/models/AttendanceSession.js
const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    label: { type: String, trim: true, maxlength: 200, required: true },
    date: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

attendanceSessionSchema.index({ course: 1, date: -1 });

attendanceSessionSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
