// sahlearn-api/src/controllers/student.exams.controller.js
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const { success, successList, notFound } = require('../utils/apiResponse');

// Strip correctIndex from questions so students can't see answers before submitting.
// Uses toObject() to bypass the model's toJSON transform (which also sets id/removes _id),
// then manually sets id so the shape is consistent.
const stripAnswers = (exam) => {
  const obj = exam.toObject();
  obj.id = obj._id;
  delete obj._id;
  delete obj.__v;
  obj.questions = (obj.questions || []).map(({ correctIndex, ...q }) => q);
  return obj;
};

const listExams = async (req, res) => {
  const courseIds = req.student.enrolledCourses.filter((ec) => ec.course).map((ec) => ec.course);

  const exams = await Exam.find({ course: { $in: courseIds }, isPublished: true })
    .sort({ createdAt: -1 })
    .populate('course', 'title slug');

  const examIds = exams.map((e) => e._id);
  const myAttempts = await ExamAttempt.find({
    exam: { $in: examIds },
    student: req.student._id,
  }).select('exam score maxScore status submittedAt');

  const attemptMap = Object.fromEntries(myAttempts.map((a) => [a.exam.toString(), a]));

  const data = exams.map((e) => {
    const stripped = stripAnswers(e);
    const attempt = attemptMap[e._id.toString()];
    const hasShortQuestions = e.questions.some((q) => q.type === 'short');
    stripped.myAttempt = attempt
      ? {
          score: attempt.score,
          mcqScore: attempt.mcqScore,
          maxScore: attempt.maxScore,
          status: attempt.status,
          submittedAt: attempt.submittedAt,
          isPendingEssayReview: hasShortQuestions && attempt.status === 'submitted',
        }
      : null;
    return stripped;
  });

  successList(res, data, { total: data.length });
};

const getExam = async (req, res) => {
  const courseIds = req.student.enrolledCourses.filter((ec) => ec.course).map((ec) => ec.course.toString());

  const exam = await Exam.findById(req.params.id).populate('course', 'title slug');
  if (!exam || !exam.isPublished) return notFound(res, 'Exam not found');

  if (!courseIds.includes(exam.course._id.toString())) {
    return res.status(403).json({ status: 'error', message: 'You are not enrolled in this course' });
  }

  const myAttempt = await ExamAttempt.findOne({ exam: exam._id, student: req.student._id });

  if (myAttempt) {
    // Reveal correct answers after submission — use toJSON shape (id already mapped)
    const obj = exam.toJSON();
    const hasShortQuestions = exam.questions.some((q) => q.type === 'short');
    const attemptObj = myAttempt.toJSON();
    attemptObj.isPendingEssayReview = hasShortQuestions && myAttempt.status === 'submitted';
    return success(res, { exam: obj, myAttempt: attemptObj });
  }

  success(res, { exam: stripAnswers(exam), myAttempt: null });
};

const submitExam = async (req, res) => {
  const courseIds = req.student.enrolledCourses
    .filter((ec) => ec.course)
    .map((ec) => ec.course.toString());

  const exam = await Exam.findById(req.params.id);
  if (!exam || !exam.isPublished) return notFound(res, 'Exam not found');

  if (!courseIds.includes(exam.course.toString())) {
    return res.status(403).json({ status: 'error', message: 'You are not enrolled in this course' });
  }

  const existing = await ExamAttempt.findOne({ exam: exam._id, student: req.student._id });
  if (existing) {
    return res.status(409).json({ status: 'error', message: 'You have already submitted this exam' });
  }

  const { answers } = req.body;

  let mcqScore = 0;
  for (const answer of answers || []) {
    const q = exam.questions[answer.questionIndex];
    if (!q) continue;
    if (q.type === 'mcq' && answer.selectedIndex === q.correctIndex) {
      mcqScore += q.points || 1;
    }
  }

  let attempt;
  try {
    attempt = await ExamAttempt.create({
      exam: exam._id,
      student: req.student._id,
      answers: answers || [],
      mcqScore,
      score: mcqScore, // essay scores added later by admin
      maxScore: exam.totalPoints,
      submittedAt: new Date(),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ status: 'error', message: 'You have already submitted this exam' });
    }
    throw err;
  }

  success(res, attempt, 201);
};

const getMyAttempts = async (req, res) => {
  const attempts = await ExamAttempt.find({ student: req.student._id })
    .sort({ submittedAt: -1 })
    .populate({
      path: 'exam',
      select: 'title course totalPoints questions',
      populate: { path: 'course', select: 'title slug' },
    });

  const data = attempts.map((a) => {
    const obj = a.toJSON();
    const hasShortQuestions = a.exam?.questions?.some((q) => q.type === 'short');
    obj.isPendingEssayReview = hasShortQuestions && a.status === 'submitted';
    return obj;
  });

  success(res, data);
};

module.exports = { listExams, getExam, submitExam, getMyAttempts };
