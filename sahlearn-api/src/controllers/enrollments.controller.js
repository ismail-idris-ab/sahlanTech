const crypto = require('crypto');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { success, successList, notFound } = require('../utils/apiResponse');
const { sendMail } = require('../utils/mailer');
const {
  enrollmentPaystackConfirmed,
  enrollmentBankTransferConfirmed,
  enrollmentBankTransferReceived,
  studentWelcomeTemplate,
} = require('../utils/emailTemplates');
const Student = require('../models/Student');

async function createStudentAccount(enrollment) {
  let student = await Student.findOne({ email: enrollment.email });

  if (student) {
    // Re-enrollment: add course to existing account if not already linked
    const alreadyLinked = student.enrolledCourses.some(
      (e) => e.enrollmentId?.toString() === enrollment._id.toString()
    );
    if (!alreadyLinked && enrollment.course) {
      student.enrolledCourses.push({
        course: enrollment.course,
        enrollmentId: enrollment._id,
        enrolledAt: new Date(),
      });
      await student.save();
    }
    return student;
  }

  const count = await Student.countDocuments();
  const studentId = `STU-${String(count + 1).padStart(4, '0')}`;
  const tempPassword = crypto.randomBytes(8).toString('hex'); // 16-char hex

  student = await Student.create({
    studentId,
    fullName: enrollment.fullName,
    email: enrollment.email,
    phone: enrollment.phone,
    password: tempPassword,
    enrolledCourses: enrollment.course
      ? [{ course: enrollment.course, enrollmentId: enrollment._id, enrolledAt: new Date() }]
      : [],
  });

  const clientUrl = (process.env.CORS_ORIGIN || '').split(',')[0].trim();
  sendMail({
    to: student.email,
    subject: 'Welcome to Sahlearn — Your Student Account is Ready',
    html: studentWelcomeTemplate({
      fullName: student.fullName,
      studentId: student.studentId,
      email: student.email,
      tempPassword,
      loginUrl: `${clientUrl}/student/login`,
    }),
  });

  return student;
}

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

// POST /api/enrollments
const create = async (req, res) => {
  const { course: courseId, courseTitleSnapshot, paymentMethod, paymentRef, amountPaid } = req.body;

  let titleSnapshot = courseTitleSnapshot || 'General Inquiry';
  if (courseId) {
    const found = await Course.findById(courseId).select('title');
    if (found) titleSnapshot = found.title;
  }

  // Paystack ref must be unique if supplied
  if (paymentRef) {
    const existing = await Enrollment.findOne({ paymentRef });
    if (existing) {
      return res.status(409).json({ status: 'error', message: 'Duplicate payment reference.' });
    }
  }

  const isPaid = !!paymentRef && paymentMethod === 'paystack';

  const enrollment = await Enrollment.create({
    ...req.body,
    courseTitleSnapshot: titleSnapshot,
    paymentMethod: paymentMethod || 'bank_transfer',
    paymentStatus: isPaid ? 'paid' : 'pending',
    paymentRef: paymentRef || undefined,
    amountPaid: amountPaid || 0,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Send confirmation email (non-blocking)
  if (isPaid) {
    sendMail({
      to: enrollment.email,
      subject: 'Payment Confirmed — Sahlearn Enrollment',
      html: enrollmentPaystackConfirmed({
        fullName: enrollment.fullName,
        courseTitleSnapshot: enrollment.courseTitleSnapshot,
        amountPaid: enrollment.amountPaid,
        paymentRef: enrollment.paymentRef,
      }),
    });
  } else if (paymentMethod === 'bank_transfer' || !paymentMethod) {
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
  }

  success(res, { id: enrollment._id }, 201);
};

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

  // Fetch before update so we can detect payment status transition
  const before = await Enrollment.findById(req.params.id).select('status paymentStatus paymentMethod email fullName courseTitleSnapshot amountPaid');
  if (!before) return notFound(res, 'Enrollment not found');

  const enrollment = await Enrollment.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  );

  // Admin manually confirmed bank transfer payment — notify student
  const wasJustPaid =
    updates.paymentStatus === 'paid' &&
    before.paymentStatus !== 'paid' &&
    before.paymentMethod === 'bank_transfer';

  if (wasJustPaid) {
    sendMail({
      to: enrollment.email,
      subject: 'Payment Verified — Sahlearn Enrollment',
      html: enrollmentBankTransferConfirmed({
        fullName: enrollment.fullName,
        courseTitleSnapshot: enrollment.courseTitleSnapshot,
        amountPaid: enrollment.amountPaid,
      }),
    });
  }

  // Auto-create student account when enrollment is marked as enrolled
  const wasJustEnrolled =
    updates.status === 'enrolled' && before.status !== 'enrolled';

  if (wasJustEnrolled) {
    try {
      const student = await createStudentAccount(enrollment);
      await enrollment.updateOne({ studentAccount: student._id });
    } catch (err) {
      console.error('[enrollment] student account creation failed:', err.message);
      // Non-blocking — enrollment update still succeeds
    }
  }

  success(res, enrollment);
};

// DELETE /api/enrollments/:id
const remove = async (req, res) => {
  const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
  if (!enrollment) return notFound(res, 'Enrollment not found');
  success(res, { id: req.params.id });
};

// POST /api/enrollments/webhook/paystack  (raw body — verified by signature)
const paystackWebhook = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return res.status(500).end();

  const signature = req.headers['x-paystack-signature'];
  const hash = crypto
    .createHmac('sha512', secret)
    .update(req.body) // raw Buffer
    .digest('hex');

  if (hash !== signature) return res.status(401).end();

  const event = JSON.parse(req.body);

  if (event.event === 'charge.success') {
    const ref = event.data?.reference;
    if (ref) {
      const before = await Enrollment.findOne({ paymentRef: ref }).select('paymentStatus email fullName courseTitleSnapshot paymentRef');
      if (before && before.paymentStatus !== 'paid') {
        const amount = (event.data.amount || 0) / 100;
        await Enrollment.findOneAndUpdate(
          { paymentRef: ref },
          { paymentStatus: 'paid', amountPaid: amount },
        );
        sendMail({
          to: before.email,
          subject: 'Payment Confirmed — Sahlearn Enrollment',
          html: enrollmentPaystackConfirmed({
            fullName: before.fullName,
            courseTitleSnapshot: before.courseTitleSnapshot,
            amountPaid: amount,
            paymentRef: ref,
          }),
        });
      }
    }
  }

  res.status(200).end();
};

module.exports = { create, list, update, remove, paystackWebhook };
