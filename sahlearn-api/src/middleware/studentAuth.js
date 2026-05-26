// sahlearn-api/src/middleware/studentAuth.js
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

const studentAuthMiddleware = async (req, res, next) => {
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

  if (payload.role !== 'student') {
    return res.status(403).json({ status: 'error', message: 'Forbidden' });
  }

  const student = await Student.findById(payload.id);
  if (!student || !student.isActive) {
    return res.status(401).json({ status: 'error', message: 'Student not found or inactive' });
  }

  req.student = student;
  next();
};

module.exports = studentAuthMiddleware;
