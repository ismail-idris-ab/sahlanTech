// sahlearn-api/src/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    sender: { type: String, enum: ['student', 'admin'], required: true },
    content: { type: String, trim: true, maxlength: 2000, default: '' },
    readByAdmin: { type: Boolean, default: false },
    readByStudent: { type: Boolean, default: false },
    file: {
      url: { type: String },
      public_id: { type: String },
      originalName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
    },
  },
  { timestamps: true }
);

messageSchema.index({ student: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
