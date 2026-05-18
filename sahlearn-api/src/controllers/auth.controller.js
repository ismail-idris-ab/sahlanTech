const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success } = require('../utils/apiResponse');

const register = async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ status: 'error', message: 'Email already in use' });
  }

  const user = await User.create({ name, email, password, role: 'admin' });
  success(res, { id: user._id, name: user.name, email: user.email, role: user.role }, 201);
};

const listAdmins = async (_req, res) => {
  const users = await User.find({ role: 'admin' }).sort({ createdAt: -1 });
  success(res, users);
};

const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  if (req.user._id.toString() === id) {
    return res.status(400).json({ status: 'error', message: 'Cannot delete your own account' });
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

  success(res, { message: 'Admin deleted' });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
  }

  const match = await user.comparePassword(password);
  if (!match) {
    return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  success(res, {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
};

const me = async (req, res) => {
  success(res, req.user);
};

module.exports = { register, listAdmins, deleteAdmin, login, me };
