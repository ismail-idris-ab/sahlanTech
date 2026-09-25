const Sale = require('../models/Sale');
const Payment = require('../models/Payment');

const getMyReceipts = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);

  // Voided sales are excluded outright: a cancelled sale is not money the
  // student owes, and its receipts are cancelled with it.
  const sales = await Sale.find({ 'customer.student': req.student._id, voidedAt: null }).lean();
  const saleIds = sales.map((s) => s._id);
  const saleById = new Map(sales.map((s) => [String(s._id), s]));

  const filter = { sale: { $in: saleIds }, voidedAt: null };
  const [total, payments] = await Promise.all([
    Payment.countDocuments(filter),
    Payment.find(filter).sort({ paidAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);

  const summary = sales.reduce(
    (acc, s) => ({
      totalPaid: acc.totalPaid + (s.amountPaid || 0),
      outstanding: acc.outstanding + Math.max((s.total || 0) - (s.amountPaid || 0), 0),
    }),
    { totalPaid: 0, outstanding: 0 }
  );

  res.status(200).json({
    status: 'success',
    data: payments.map((p) => {
      const sale = saleById.get(String(p.sale));
      return {
        id: p._id,
        receiptNo: p.receiptNo,
        token: p.publicToken,
        paidAt: p.paidAt,
        amount: p.amount,
        method: p.method,
        saleNo: sale?.saleNo,
        description: sale?.items?.[0]?.description || 'Payment',
        total: sale?.total || 0,
        balance: Math.max((sale?.total || 0) - (sale?.amountPaid || 0), 0),
      };
    }),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    summary,
  });
};

module.exports = { getMyReceipts };
