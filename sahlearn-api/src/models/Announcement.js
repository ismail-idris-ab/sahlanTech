// sahlearn-api/src/models/Announcement.js
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    file: {
      url: { type: String },
      public_id: { type: String },
      originalName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
    },
    target: {
      type: String,
      enum: ['all', 'course', 'students'],
      default: 'all',
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  },
  { timestamps: true }
);

announcementSchema.index({ createdAt: -1 });

announcementSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Announcement', announcementSchema);
