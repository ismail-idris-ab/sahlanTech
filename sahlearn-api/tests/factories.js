const jwt = require('jsonwebtoken');
const DailyQuiz = require('../src/models/DailyQuiz');
const Student = require('../src/models/Student');
const User = require('../src/models/User');
const { lagosDateKey } = require('../src/utils/dateKey');

let counter = 0;
const uniq = () => `${Date.now()}${(counter += 1)}`;

const makeQuestions = (n = 5) =>
  Array.from({ length: n }, (_, i) => ({
    text: `Question ${i + 1}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: i % 4,
    points: 1,
  }));

const createQuiz = (overrides = {}) =>
  DailyQuiz.create({
    date: lagosDateKey(),
    title: 'Quiz of the day',
    description: 'Five quick questions.',
    questions: makeQuestions(),
    isPublished: true,
    publishedAt: new Date(),
    ...overrides,
  });

const createStudent = (overrides = {}) => {
  const n = uniq();
  return Student.create({
    studentId: `SAH/${n}`,
    fullName: 'Test Student',
    email: `student${n}@example.com`,
    password: 'password123',
    isActive: true,
    ...overrides,
  });
};

const createAdminToken = async () => {
  const n = uniq();
  const admin = await User.create({
    name: 'Test Admin',
    email: `admin${n}@example.com`,
    password: 'password123',
    role: 'admin',
  });
  return jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const createStudentToken = (student) =>
  jwt.sign({ id: student._id, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '1h' });

module.exports = { makeQuestions, createQuiz, createStudent, createAdminToken, createStudentToken };
