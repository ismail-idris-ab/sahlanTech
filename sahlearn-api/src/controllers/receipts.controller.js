// sahlearn-api/src/controllers/receipts.controller.js
// PUBLIC. No auth. Anyone with the link can read this, so the payload is built
// field by field and never by serializing a document — that is what keeps the
// customer's phone number and the student id off a page that gets forwarded.
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Sale = require('../models/Sale');
const { success } = require('../utils/apiResponse');
const { generateReceipt } = require('../utils/pdf');

const TOKEN = /^[0-9a-f]{32}$/;
const notFound = (res) => res.status(404).json({ status: 'error', message: 'Receipt not found' });

const findPaymentByToken = async (token) => {
  if (typeof token !== 'string' || !TOKEN.test(token)) return null;
  const payment = await Payment.findOne({ publicToken: token }).lean();
  if (!payment) return null;
  const sale = await Sale.findById(payment.sale).lean();
  if (!sale) return null;
  return { payment, sale };
};

// The sum paid up to and including this receipt, so a customer reading an old
// receipt sees what was true when it was issued rather than today's figure.
const paidUpTo = async (sale, payment) => {
  const [totals] = await Payment.aggregate([
    { $match: { sale: sale._id, voidedAt: null, paidAt: { $lte: payment.paidAt } } },
    { $group: { _id: null, paid: { $sum: '$amount' } } },
  ]);
  return totals?.paid || 0;
};

const buildReceipt = async (sale, payment) => {
  const totalPaid = payment.voidedAt ? sale.amountPaid : await paidUpTo(sale, payment);
  return {
    receiptNo: payment.receiptNo,
    paidAt: payment.paidAt,
    method: payment.method,
    reference: payment.reference || '',
    void: !!payment.voidedAt,
    voidReason: payment.voidReason || null,
    customerName: sale.customer.fullName,
    saleNo: sale.saleNo,
    items: sale.items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
    })),
    subtotal: sale.subtotal,
    discountAmount: sale.discountAmount,
    discountReason: sale.discount?.reason || '',
    total: sale.total,
    amountThisPayment: payment.amount,
    totalPaid,
    balance: Math.max(sale.total - totalPaid, 0),
  };
};

const getPublicReceipt = async (req, res) => {
  const found = await findPaymentByToken(req.params.token);
  // Same message for a malformed token and an unknown one, so this cannot be
  // used to learn anything about which receipts exist.
  if (!found) return notFound(res);
  success(res, await buildReceipt(found.sale, found.payment));
};

const getPublicReceiptPdf = async (req, res) => {
  const found = await findPaymentByToken(req.params.token);
  if (!found) return notFound(res);
  generateReceipt(res, await buildReceipt(found.sale, found.payment));
};

const getAdminReceiptPdf = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ status: 'error', message: 'Invalid payment id' });
  }
  const payment = await Payment.findById(req.params.id).lean();
  if (!payment) return notFound(res);
  const sale = await Sale.findById(payment.sale).lean();
  if (!sale) return notFound(res);

  generateReceipt(res, await buildReceipt(sale, payment));
};

module.exports = {
  getPublicReceipt,
  getPublicReceiptPdf,
  getAdminReceiptPdf,
  findPaymentByToken,
  buildReceipt,
};
