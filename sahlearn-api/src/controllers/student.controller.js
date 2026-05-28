// sahlearn-api/src/controllers/student.controller.js
const cloudinary = require('../config/cloudinary');
const Student = require('../models/Student');
const { success } = require('../utils/apiResponse');

const getMe = async (req, res) => {
  const student = await Student.findById(req.student._id).populate('enrolledCourses.course', 'title slug coverImage category');
  success(res, student);
};

const updateMe = async (req, res) => {
  const allowed = ['fullName', 'phone', 'dateOfBirth', 'address', 'bio'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const student = await Student.findByIdAndUpdate(req.student._id, updates, { new: true, runValidators: true });
  success(res, student);
};

const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }

  const student = await Student.findById(req.student._id);

  // Delete old avatar from Cloudinary if exists
  if (student.avatar?.public_id) {
    await cloudinary.uploader.destroy(student.avatar.public_id).catch(() => {});
  }

  student.avatar = { url: req.file.path, public_id: req.file.filename };
  await student.save();

  success(res, { avatar: student.avatar });
};

const deleteAvatar = async (req, res) => {
  const student = await Student.findById(req.student._id);

  if (student.avatar?.public_id) {
    await cloudinary.uploader.destroy(student.avatar.public_id).catch(() => {});
  }

  student.avatar = undefined;
  await student.save();

  success(res, { message: 'Avatar removed' });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const student = await Student.findById(req.student._id).select('+password');
  const match = await student.comparePassword(currentPassword);
  if (!match) {
    return res.status(400).json({ status: 'error', message: 'Current password is incorrect' });
  }

  student.password = newPassword;
  student.tempPassword = undefined;
  await student.save();

  success(res, { message: 'Password changed successfully' });
};

module.exports = { getMe, updateMe, uploadAvatar, deleteAvatar, changePassword };
