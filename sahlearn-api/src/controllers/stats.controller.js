const Course = require('../models/Course');
const Post = require('../models/Post');
const ContactMessage = require('../models/ContactMessage');
const Enrollment = require('../models/Enrollment');
const { success } = require('../utils/apiResponse');

const getStats = async (_req, res) => {
  const [
    totalCourses,
    publishedCourses,
    totalPosts,
    publishedPosts,
    totalMessages,
    newMessages,
    totalEnrollments,
    pendingEnrollments,
  ] = await Promise.all([
    Course.countDocuments(),
    Course.countDocuments({ isPublished: true }),
    Post.countDocuments(),
    Post.countDocuments({ status: 'published' }),
    ContactMessage.countDocuments(),
    ContactMessage.countDocuments({ status: 'new' }),
    Enrollment.countDocuments(),
    Enrollment.countDocuments({ status: 'pending' }),
  ]);

  success(res, {
    courses: { total: totalCourses, published: publishedCourses },
    posts: { total: totalPosts, published: publishedPosts },
    messages: { total: totalMessages, new: newMessages },
    enrollments: { total: totalEnrollments, pending: pendingEnrollments },
  });
};

module.exports = { getStats };
