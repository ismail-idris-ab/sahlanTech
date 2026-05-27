const Message = require('../models/Message');
const Student = require('../models/Student');
const { success, successList, notFound } = require('../utils/apiResponse');

const listConversations = async (req, res) => {
  const conversations = await Message.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$student',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$sender', 'student'] }, { $eq: ['$readByAdmin', false] }] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: '$student' },
    {
      $project: {
        _id: 0,
        studentId: '$student._id',
        studentName: '$student.fullName',
        studentCode: '$student.studentId',
        studentAvatar: '$student.avatar',
        lastMessage: 1,
        unreadCount: 1,
      },
    },
  ]);

  success(res, conversations);
};

const getConversation = async (req, res) => {
  const student = await Student.findById(req.params.studentId).lean();
  if (!student) return notFound(res, 'Student not found');

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  const filter = { student: req.params.studentId };
  const [messages, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    Message.countDocuments(filter),
  ]);

  // Mark all student messages as read by admin
  await Message.updateMany(
    { student: req.params.studentId, sender: 'student', readByAdmin: false },
    { readByAdmin: true }
  );

  success(res, {
    student: {
      id: student._id,
      studentId: student.studentId,
      fullName: student.fullName,
      email: student.email,
      avatar: student.avatar,
    },
    messages,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

const sendReply = async (req, res) => {
  const student = await Student.findById(req.params.studentId).lean();
  if (!student) return notFound(res, 'Student not found');

  const message = await Message.create({
    student: req.params.studentId,
    sender: 'admin',
    content: req.body.content,
    readByAdmin: true,
    readByStudent: false,
  });

  success(res, message, 201);
};

const getTotalUnread = async (req, res) => {
  const count = await Message.countDocuments({ sender: 'student', readByAdmin: false });
  success(res, { count });
};

module.exports = { listConversations, getConversation, sendReply, getTotalUnread };
