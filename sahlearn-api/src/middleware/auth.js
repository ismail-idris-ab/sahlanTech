const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }

  const user = await User.findById(payload.id).select('-password');
  if (!user || !user.isActive) {
    return res.status(401).json({ status: 'error', message: 'User not found or inactive' });
  }

  if (user.role !== 'admin') {
    return res.status(403).json({ status: 'error', message: 'Forbidden' });
  }

  req.user = user;
  next();
};

module.exports = authMiddleware;
