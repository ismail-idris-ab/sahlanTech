// sahlearn-api/src/controllers/student.announcements.controller.js
const Announcement = require('../models/Announcement');
const { success } = require('../utils/apiResponse');

// GET /api/student/announcements
const getMyAnnouncements = async (req, res) => {
  const studentId = req.student._id;
  const courseIds = req.student.enrolledCourses.filter((ec) => ec.course).map((ec) => ec.course);

  const announcements = await Announcement.find({
    $or: [
      { target: 'all' },
      { target: 'course', course: { $in: courseIds } },
      { target: 'students', studentIds: studentId },
    ],
  })
    .sort({ createdAt: -1 })
    .populate('course', 'title')
    .lean();

  success(res, announcements.map((a) => ({ ...a, id: a._id })));
};

module.exports = { getMyAnnouncements };
