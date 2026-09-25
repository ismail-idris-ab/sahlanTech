// sahlearn-api/src/utils/docNumber.js
// Sequential, human-readable document numbers. Same Counter pattern as the
// enrollment codes in controllers/enrollments.controller.js.
//
// findByIdAndUpdate with $inc is atomic in MongoDB, so two requests arriving at
// the same instant get different numbers. Nothing else in this feature
// guarantees that.
const Counter = require('../models/Counter');
const { lagosDateKey } = require('./dateKey');

const nextSeq = async (key) => {
  const doc = await Counter.findByIdAndUpdate(key, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return doc.seq;
};

// The year restarts the sequence each January and is visible in the number, so
// 'SAH/R/2026/0007' is unambiguous forever.
const currentYear = () => lagosDateKey().slice(0, 4);

const nextSaleNo = async () => {
  const year = currentYear();
  const seq = await nextSeq(`sale-${year}`);
  return `SAH/S/${year}/${String(seq).padStart(4, '0')}`;
};

const nextReceiptNo = async () => {
  const year = currentYear();
  const seq = await nextSeq(`receipt-${year}`);
  return `SAH/R/${year}/${String(seq).padStart(4, '0')}`;
};

module.exports = { nextSaleNo, nextReceiptNo };
