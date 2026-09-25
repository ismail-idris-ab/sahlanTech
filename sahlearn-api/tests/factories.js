const jwt = require('jsonwebtoken');
const DailyQuiz = require('../src/models/DailyQuiz');
const Student = require('../src/models/Student');
const User = require('../src/models/User');
const { lagosDateKey } = require('../src/utils/dateKey');

let counter = 0;
const uniq = () => `${Date.now()}${(counter += 1)}`;

// Attempts are unique per phone per day, so every taker in a test needs a
// distinct number. '0801' + 7 digits satisfies the Nigerian mobile format.
let phoneCounter = 0;
const uniquePhone = () => {
  phoneCounter += 1;
  return `0801${String(phoneCounter).padStart(7, '0')}`;
};

// The body POST /api/daily-quiz/start now expects. Pass a student to link the
// attempt to their dashboard, or omit it to take the quiz as a guest.
const startBody = ({ student, fullName, phone } = {}) => ({
  fullName: fullName || student?.fullName || 'Guest Taker',
  phone: phone || uniquePhone(),
  ...(student ? { studentId: student.studentId } : {}),
});

const makeQuestions = (n = 5) =>
  Array.from({ length: n }, (_, i) => ({
    text: `Question ${i + 1}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: i % 4,
    points: 1,
  }));

const makeEssayQuestions = (n = 1, points = 5) =>
  Array.from({ length: n }, (_, i) => ({
    type: 'essay',
    text: `Essay question ${i + 1}`,
    points,
  }));

// A quiz that mixes both kinds: `mcq` auto-scored questions worth 1 each,
// followed by `essay` questions worth `essayPoints` each.
const createMixedQuiz = ({ mcq = 2, essay = 1, essayPoints = 5, ...overrides } = {}) =>
  DailyQuiz.create({
    date: lagosDateKey(),
    title: 'Mixed quiz',
    questions: [...makeQuestions(mcq), ...makeEssayQuestions(essay, essayPoints)],
    isPublished: true,
    publishedAt: new Date(),
    ...overrides,
  });

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

module.exports = {
  uniquePhone,
  startBody,
  makeQuestions,
  makeEssayQuestions,
  createQuiz,
  createMixedQuiz,
  createStudent,
  createAdminToken,
  createStudentToken,
};

// Body for POST /api/admin/sales. Default sale totals 50000.
const saleBody = (overrides = {}) => {
  const { fullName, phone, items, ...rest } = overrides;
  return {
    fullName: fullName || 'Musa Ibrahim',
    phone: phone === undefined ? '08012345678' : phone,
    items: items || [{ description: 'Full Stack Course', quantity: 1, unitPrice: 50000 }],
    ...rest,
  };
};

module.exports.saleBody = saleBody;
