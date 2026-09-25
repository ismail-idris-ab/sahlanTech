const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { nextSaleNo, nextReceiptNo } = require('../utils/docNumber');
const { success, successList } = require('../utils/apiResponse');
const { recomputeSale, outstandingBalance } = require('../services/sales.service');

const badId = (res, what = 'sale') =>
  res.status(400).json({ status: 'error', message: `Invalid ${what} id` });
const missing = (res) => res.status(404).json({ status: 'error', message: 'Sale not found' });
const voided = (res) =>
  res.status(409).json({ status: 'error', message: 'This sale has been voided.' });

// A search box is user input going into a regex. Escaping it stops '(' or '['
// throwing, and stops a pathological pattern pinning the database.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const listSales = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);

  const filter = {};
  if (['unpaid', 'part_paid', 'paid', 'void'].includes(req.query.status)) {
    filter.status = req.query.status;
  }
  const q = (req.query.q || '').trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ 'customer.fullName': rx }, { 'customer.phone': rx }, { saleNo: rx }];
  }

  const [total, sales] = await Promise.all([
    Sale.countDocuments(filter),
    Sale.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  successList(
    res,
    sales.map((s) => ({ ...s, id: s._id })),
    { page, limit, total, totalPages: Math.ceil(total / limit) }
  );
};

const createSale = async (req, res) => {
  // A student ID is optional, but a wrong one is refused rather than quietly
  // dropped — otherwise the sale silently never reaches the student's dashboard.
  let student = null;
  const studentId = (req.body.studentId || '').trim();
  if (studentId) {
    student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'We could not find that student ID. Leave it blank for a non-student customer.',
      });
    }
  }

  // Only these fields are read from the body. Any subtotal, total, balance,
  // amountPaid or status the client sent is ignored.
  const sale = await Sale.create({
    saleNo: await nextSaleNo(),
    customer: {
      fullName: req.body.fullName,
      phone: req.body.phone,
      student: student ? student._id : null,
    },
    items: (req.body.items || []).map((i) => ({
      description: i.description,
      course: i.course || undefined,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
    discount: req.body.discount || { type: 'amount', value: 0 },
    notes: req.body.notes,
    issuedBy: req.user._id,
  });

  success(res, sale, 201);
};

const getSale = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const sale = await Sale.findById(req.params.id).lean();
  if (!sale) return missing(res);

  const payments = await Payment.find({ sale: sale._id }).sort({ paidAt: 1 }).lean();

  success(res, {
    ...sale,
    id: sale._id,
    payments: payments.map((p) => ({ ...p, id: p._id })),
  });
};

const updateSale = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const sale = await Sale.findById(req.params.id);
  if (!sale) return missing(res);
  if (sale.voidedAt) return voided(res);

  const changesMoney = req.body.items !== undefined || req.body.discount !== undefined;
  if (changesMoney) {
    // Rewriting what was sold after money changed hands would invalidate a
    // receipt the customer already holds, so it is refused rather than silently
    // accepted.
    const paid = await Payment.exists({ sale: sale._id, voidedAt: null });
    if (paid) {
      return res.status(409).json({
        status: 'error',
        message:
          'This sale has already been paid against, so its items and discount cannot be changed.',
      });
    }
    if (req.body.items !== undefined) {
      sale.items = req.body.items.map((i) => ({
        description: i.description,
        course: i.course || undefined,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      }));
    }
    if (req.body.discount !== undefined) sale.discount = req.body.discount;
  }

  if (req.body.fullName !== undefined) sale.customer.fullName = req.body.fullName;
  if (req.body.phone !== undefined) sale.customer.phone = req.body.phone;
  if (req.body.notes !== undefined) sale.notes = req.body.notes;

  await sale.save();
  success(res, sale);
};

const voidSale = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const sale = await Sale.findById(req.params.id);
  if (!sale) return missing(res);
  if (sale.voidedAt) return voided(res);

  const now = new Date();
  // Voiding the sale voids its receipts too: a receipt for a cancelled sale
  // would otherwise still read as valid in the customer's hand.
  await Payment.updateMany(
    { sale: sale._id, voidedAt: null },
    { $set: { voidedAt: now, voidReason: req.body.reason } }
  );

  sale.voidedAt = now;
  sale.voidReason = req.body.reason;
  sale.amountPaid = 0;
  await sale.save();

  success(res, sale);
};

const recordPayment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res);
  const sale = await Sale.findById(req.params.id);
  if (!sale) return missing(res);
  if (sale.voidedAt) {
    return res.status(409).json({
      status: 'error',
      message: 'This sale has been voided, so no further payment can be recorded against it.',
    });
  }

  const { amount } = req.body;
  const balance = outstandingBalance(sale);
  // Overpayment is a refund problem, and refunds are out of scope. Refused with
  // the figure named, so the admin can see what to collect.
  if (amount > balance) {
    const shown = `₦${balance.toLocaleString('en-NG')}`;
    return res.status(422).json({
      status: 'error',
      message: `That is more than the outstanding balance of ${shown}.`,
      errors: [{ field: 'amount', message: `The balance is ${shown}` }],
    });
  }

  const payment = await Payment.create({
    sale: sale._id,
    receiptNo: await nextReceiptNo(),
    amount,
    method: req.body.method,
    reference: req.body.reference,
    paidAt: req.body.paidAt ? new Date(req.body.paidAt) : new Date(),
    recordedBy: req.user._id,
  });

  const updated = await recomputeSale(sale._id);
  success(res, { payment, sale: updated }, 201);
};

const voidPayment = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return badId(res, 'payment');
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ status: 'error', message: 'Payment not found' });
  if (payment.voidedAt) {
    return res.status(409).json({ status: 'error', message: 'This receipt has already been voided.' });
  }

  payment.voidedAt = new Date();
  payment.voidReason = req.body.reason;
  await payment.save();

  // Recomputed from the surviving rows, not decremented, so a double void
  // cannot push the balance the wrong way.
  const sale = await recomputeSale(payment.sale);
  success(res, { payment, sale });
};

module.exports = {
  listSales,
  createSale,
  getSale,
  updateSale,
  voidSale,
  recordPayment,
  voidPayment,
};
