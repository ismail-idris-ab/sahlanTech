const Message = require('../models/Message');
const { success, successList } = require('../utils/apiResponse');

const getMessages = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30));
  const skip = (page - 1) * limit;

  const filter = { student: req.student._id };

  const [messages, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    Message.countDocuments(filter),
  ]);

  // Mark all admin messages as read by student
  await Message.updateMany(
    { student: req.student._id, sender: 'admin', readByStudent: false },
    { readByStudent: true }
  );

  successList(res, messages, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};

const sendMessage = async (req, res) => {
  const content = req.body.content || '';
  const file = req.file
    ? {
        url: req.file.path,
        public_id: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      }
    : undefined;

  if (!content && !file) {
    return res.status(400).json({ status: 'error', message: 'Message or file required' });
  }

  const message = await Message.create({
    student: req.student._id,
    sender: 'student',
    content,
    file,
    readByAdmin: false,
    readByStudent: true,
  });

  success(res, message, 201);
};

const getUnreadCount = async (req, res) => {
  const count = await Message.countDocuments({
    student: req.student._id,
    sender: 'admin',
    readByStudent: false,
  });
  success(res, { count });
};

module.exports = { getMessages, sendMessage, getUnreadCount };
