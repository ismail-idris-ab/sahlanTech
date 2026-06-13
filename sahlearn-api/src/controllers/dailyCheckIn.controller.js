const DailyCheckIn = require('../models/DailyCheckIn');
const { success, successList } = require('../utils/apiResponse');

function todayString() {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/* ── Student: mark present ── */
const checkIn = async (req, res) => {
  const studentId = req.student._id;
  const date = todayString();

  const existing = await DailyCheckIn.findOne({ student: studentId, date });
  if (existing) {
    return res.status(409).json({
      status: 'error',
      message: 'You already did your attendance for today',
    });
  }

  const record = await DailyCheckIn.create({ student: studentId, date });
  success(res, record, 201);
};

/* ── Student: view own records ── */
const getMyCheckIns = async (req, res) => {
  const records = await DailyCheckIn.find({ student: req.student._id })
    .sort({ checkedInAt: -1 })
    .lean();

  const today = todayString();
  const checkedInToday = records.some((r) => r.date === today);

  const formatted = records.map((r) => ({
    _id: r._id,
    date: r.date,
    time: formatTime(r.checkedInAt),
    checkedInAt: r.checkedInAt,
  }));

  success(res, { checkedInToday, records: formatted });
};

/* ── Admin: list all check-ins (search + pagination) ── */
const getAdminCheckIns = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const search = (req.query.search || '').trim();

  let studentFilter = {};
  if (search) {
    const Student = require('../models/Student');
    const students = await Student.find({
      $or: [
        { fullName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ],
    }).select('_id').lean();
    studentFilter = { student: { $in: students.map((s) => s._id) } };
  }

  const total = await DailyCheckIn.countDocuments(studentFilter);
  const records = await DailyCheckIn.find(studentFilter)
    .populate('student', 'fullName studentId')
    .sort({ checkedInAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const formatted = records.map((r) => ({
    _id: r._id,
    name: r.student?.fullName || '—',
    regNo: r.student?.studentId || '—',
    date: r.date,
    time: formatTime(r.checkedInAt),
    checkedInAt: r.checkedInAt,
  }));

  successList(res, formatted, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  });
};

/* ── Admin: delete one ── */
const deleteCheckIn = async (req, res) => {
  await DailyCheckIn.findByIdAndDelete(req.params.id);
  success(res, { deleted: true });
};

/* ── Admin: delete selected (body.ids) or all (no body) ── */
const deleteCheckIns = async (req, res) => {
  const { ids } = req.body;
  const filter = Array.isArray(ids) && ids.length ? { _id: { $in: ids } } : {};
  const result = await DailyCheckIn.deleteMany(filter);
  success(res, { deleted: result.deletedCount });
};

/* ── Admin: export CSV ── */
const exportCheckIns = async (req, res) => {
  const records = await DailyCheckIn.find()
    .populate('student', 'fullName studentId')
    .sort({ checkedInAt: -1 })
    .lean();

  const rows = records.map((r) => {
    const name  = (r.student?.fullName || '').replace(/,/g, ' ');
    const regNo = (r.student?.studentId || '').replace(/,/g, ' ');
    return `${name},${regNo},Present,${r.date},${formatTime(r.checkedInAt)}`;
  });

  const csv = ['Name,Reg No.,Status,Date,Time', ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
  res.send(csv);
};

module.exports = { checkIn, getMyCheckIns, getAdminCheckIns, deleteCheckIn, deleteCheckIns, exportCheckIns };
