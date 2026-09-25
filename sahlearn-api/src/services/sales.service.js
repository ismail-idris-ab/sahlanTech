// sahlearn-api/src/services/sales.service.js
// A sale's paid figure is derived here and nowhere else.
//
// It is recomputed from the surviving payment rows every time, never
// incremented or decremented. Voiding a payment and re-voiding it, or two
// requests landing together, therefore cannot make the total drift away from
// the rows it is supposed to summarize.
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');

const outstandingBalance = (sale) => Math.max((sale?.total || 0) - (sale?.amountPaid || 0), 0);

const recomputeSale = async (saleId) => {
  if (!mongoose.isValidObjectId(saleId)) return null;
  const sale = await Sale.findById(saleId);
  if (!sale) return null;

  const [totals] = await Payment.aggregate([
    { $match: { sale: sale._id, voidedAt: null } },
    { $group: { _id: null, paid: { $sum: '$amount' } } },
  ]);

  sale.amountPaid = totals?.paid || 0;
  // balance and status are derived by the model's pre('validate') hook.
  await sale.save();
  return sale;
};

module.exports = { recomputeSale, outstandingBalance };
