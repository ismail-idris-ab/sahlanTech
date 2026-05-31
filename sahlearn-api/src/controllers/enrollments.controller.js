const Counter = require('../models/Counter');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Student = require('../models/Student');
const { success, successList, notFound } = require('../utils/apiResponse');
const { sendMail } = require('../utils/mailer');
const {
  enrollmentBankTransferReceived,
  studentWelcomeTemplate,
  courseEnrolledTemplate,
} = require('../utils/emailTemplates');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function nextSeq(key) {
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

function deriveCourseCode(title) {
  const stopwords = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'in', 'to', 'for', 'with', 'on', 'at', 'by', 'from', 'is', 'it', 'as']);
  const words = title
    .trim()
    .split(/\s+/)
    .filter((w) => !stopwords.has(w.toLowerCase()) && /[a-zA-Z]/.test(w));
  if (words.length === 0) return title.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function buildWhatsAppLink(phone, text) {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

// ─── Shared confirmation logic ────────────────────────────────────────────────
// enrollment must have course populated with { title, courseCode }

async function _confirmEnrollment(enrollment, { amountPaid } = {}) {
  const year = new Date().getFullYear();
  const course = enrollment.course;

  // Resolve course code
  let courseCode = course?.courseCode;
  if (!courseCode && course) {
    courseCode = deriveCourseCode(course.title);
    await Course.findByIdAndUpdate(course._id, { courseCode });
  }
  courseCode = courseCode || 'GN';

  // Enrollment code: SAH-YYYY-CC-NNNN
  const enrollSeq = await nextSeq(`enroll-${courseCode}-${year}`);
  const enrollmentCode = `SAH-${year}-${courseCode}-${String(enrollSeq).padStart(4, '0')}`;

  // Find or create student account
  let student = await Student.findOne({ email: enrollment.email });
  let isNewStudent = false;
  let tempPassword = null;

  if (!student) {
    isNewStudent = true;
    const studentSeq = await nextSeq(`student-${year}`);
    const studentId = `SAH-${year}-${String(studentSeq).padStart(4, '0')}`;
    tempPassword = generateTempPassword();

    student = await Student.create({
      studentId,
      fullName: enrollment.fullName,
      email: enrollment.email,
      phone: enrollment.phone,
      password: tempPassword,
      tempPassword,
      mustChangePassword: true,
      enrolledCourses: enrollment.course
        ? [{ course: enrollment.course._id, enrollmentId: enrollment._id, enrolledAt: new Date() }]
        : [],
    });
  } else {
    const alreadyLinked = student.enrolledCourses.some(
      (e) => e.enrollmentId?.toString() === enrollment._id.toString()
    );
    if (!alreadyLinked && enrollment.course) {
      student.enrolledCourses.push({
        course: enrollment.course._id,
        enrollmentId: enrollment._id,
        enrolledAt: new Date(),
      });
      await student.save();
    }
  }

  // Update enrollment
  enrollment.paymentStatus = 'paid';
  enrollment.status = 'enrolled';
  enrollment.enrollmentCode = enrollmentCode;
  enrollment.studentAccount = student._id;
  if (amountPaid) enrollment.amountPaid = Number(amountPaid);
  await enrollment.save();

  // Send email
  const loginUrl = `${(process.env.CORS_ORIGIN || '').split(',')[0].trim()}/student/login`;
  if (isNewStudent) {
    sendMail({
      to: student.email,
      subject: 'Welcome to Sahlearn — Your Student Account is Ready',
      html: studentWelcomeTemplate({
        fullName: student.fullName,
        studentId: student.studentId,
        email: student.email,
        tempPassword,
        loginUrl,
      }),
    });
  } else {
    sendMail({
      to: student.email,
      subject: `Enrolled in ${enrollment.courseTitleSnapshot} — Sahlearn`,
      html: courseEnrolledTemplate({
        fullName: student.fullName,
        courseTitle: enrollment.courseTitleSnapshot,
        enrollmentCode,
        loginUrl,
      }),
    });
  }

  // Build WhatsApp link for admin / immediate share
  const waNumber = process.env.WA_BUSINESS_NUMBER || '';
  let waText;
  if (isNewStudent) {
    waText =
      `Hi ${student.fullName}! Your enrollment for *${enrollment.courseTitleSnapshot}* at Sahlearn has been confirmed.\n\n` +
      `*Your Login Details:*\n` +
      `Student ID: ${student.studentId}\n` +
      `Email: ${student.email}\n` +
      `Temp Password: ${tempPassword}\n` +
      `Login: ${loginUrl}\n\n` +
      `Enrollment Code: ${enrollmentCode}\n\n` +
      `Please change your password after first login.`;
  } else {
    waText =
      `Hi ${student.fullName}! You've been enrolled in *${enrollment.courseTitleSnapshot}* at Sahlearn.\n\n` +
      `Enrollment Code: ${enrollmentCode}\n` +
      `Log in at: ${loginUrl}`;
  }
  const whatsappLink = buildWhatsAppLink(enrollment.phone || waNumber, waText);

  return {
    student: { studentId: student.studentId, email: student.email },
    enrollmentCode,
    tempPassword: isNewStudent ? tempPassword : null,
    whatsappLink,
    isNewStudent,
    loginUrl,
  };
}

// ─── Public endpoints ─────────────────────────────────────────────────────────

// POST /api/enrollments
const create = async (req, res) => {
  const { course: courseId, courseTitleSnapshot, paymentMethod, amountPaid } = req.body;

  let titleSnapshot = courseTitleSnapshot || 'General Inquiry';
  let isFree = false;

  if (courseId) {
    const found = await Course.findById(courseId).select('title isFree');
    if (found) {
      titleSnapshot = found.title;
      isFree = found.isFree === true;
    }
  }

  const enrollment = await Enrollment.create({
    ...req.body,
    courseTitleSnapshot: titleSnapshot,
    mode: req.body.mode || 'online',
    paymentMethod: isFree ? 'free' : (paymentMethod || 'bank_transfer'),
    paymentStatus: isFree ? 'paid' : 'pending',
    status: isFree ? 'enrolled' : 'pending',
    amountPaid: amountPaid || 0,
    paymentProof: req.file
      ? { url: req.file.path, public_id: req.file.filename, originalName: req.file.originalname }
      : undefined,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Free course: auto-confirm immediately
  if (isFree) {
    await enrollment.populate('course', 'title courseCode');
    const result = await _confirmEnrollment(enrollment);
    return success(res, { id: enrollment._id, autoConfirmed: true, ...result }, 201);
  }

  // Paid course: notify student with bank details
  sendMail({
    to: enrollment.email,
    subject: 'Enrollment Request Received — Sahlearn',
    html: enrollmentBankTransferReceived({
      fullName: enrollment.fullName,
      courseTitleSnapshot: enrollment.courseTitleSnapshot,
      bankName: process.env.BANK_NAME,
      bankAccount: process.env.BANK_ACCOUNT,
      bankAccountName: process.env.BANK_ACCOUNT_NAME,
    }),
  });

  success(res, { id: enrollment._id }, 201);
};

// ─── Admin endpoints ──────────────────────────────────────────────────────────

// GET /api/enrollments
const list = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.course) filter.course = req.query.course;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  const [data, total] = await Promise.all([
    Enrollment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('course', 'title slug'),
    Enrollment.countDocuments(filter),
  ]);

  successList(res, data, { page, limit, total, totalPages: Math.ceil(total / limit) });
};

// PATCH /api/enrollments/:id
const update = async (req, res) => {
  const updates = {};
  if (req.body.status) updates.status = req.body.status;
  if (req.body.paymentStatus) updates.paymentStatus = req.body.paymentStatus;
  if (req.body.amountPaid !== undefined) updates.amountPaid = req.body.amountPaid;
  if (req.body.paymentRef !== undefined) updates.paymentRef = req.body.paymentRef;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;

  const enrollment = await Enrollment.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );
  if (!enrollment) return notFound(res, 'Enrollment not found');
  success(res, enrollment);
};

// DELETE /api/enrollments/:id
const remove = async (req, res) => {
  const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
  if (!enrollment) return notFound(res, 'Enrollment not found');
  success(res, { id: req.params.id });
};

// PATCH /api/enrollments/:id/confirm
const confirmPayment = async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id).populate('course', 'title courseCode');
  if (!enrollment) return notFound(res, 'Enrollment not found');

  if (enrollment.paymentStatus === 'paid' && enrollment.status === 'enrolled' && enrollment.enrollmentCode) {
    return res.status(409).json({ status: 'error', message: 'Payment already confirmed.' });
  }

  const result = await _confirmEnrollment(enrollment, { amountPaid: req.body.amountPaid });
  success(res, result);
};

// POST /api/enrollments/:id/payment-proof
const uploadPaymentProof = async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) return notFound(res, 'Enrollment not found');

  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file provided.' });
  }

  enrollment.paymentProof = {
    url: req.file.path,
    public_id: req.file.filename,
    originalName: req.file.originalname,
  };
  await enrollment.save();

  success(res, { paymentProof: enrollment.paymentProof });
};

module.exports = { create, list, update, remove, confirmPayment, uploadPaymentProof };
