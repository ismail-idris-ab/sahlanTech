const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success } = require('../utils/apiResponse');

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

module.exports = { login, me };
