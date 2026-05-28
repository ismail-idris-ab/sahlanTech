const Course = require('../models/Course');
const Post = require('../models/Post');
const ContactMessage = require('../models/ContactMessage');
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
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
    totalStudents,
    activeStudents,
    totalAssignments,
    totalSubmissions,
    ungradedSubmissions,
    totalExams,
    totalAttempts,
    pendingAttempts,
  ] = await Promise.all([
    Course.countDocuments(),
    Course.countDocuments({ isPublished: true }),
    Post.countDocuments(),
    Post.countDocuments({ status: 'published' }),
    ContactMessage.countDocuments(),
    ContactMessage.countDocuments({ status: 'new' }),
    Enrollment.countDocuments(),
    Enrollment.countDocuments({ status: 'pending' }),
    Student.countDocuments(),
    Student.countDocuments({ isActive: true }),
    Assignment.countDocuments(),
    Submission.countDocuments(),
    Submission.countDocuments({ status: 'submitted' }),
    Exam.countDocuments(),
    ExamAttempt.countDocuments(),
    ExamAttempt.countDocuments({ status: 'submitted' }),
  ]);

  success(res, {
    courses: { total: totalCourses, published: publishedCourses },
    posts: { total: totalPosts, published: publishedPosts },
    messages: { total: totalMessages, new: newMessages },
    enrollments: { total: totalEnrollments, pending: pendingEnrollments },
    students: { total: totalStudents, active: activeStudents },
    assignments: { total: totalAssignments, submissions: totalSubmissions, ungraded: ungradedSubmissions },
    exams: { total: totalExams, attempts: totalAttempts, pendingReview: pendingAttempts },
  });
};

module.exports = { getStats };
