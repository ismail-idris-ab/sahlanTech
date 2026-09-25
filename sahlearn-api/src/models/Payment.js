const mongoose = require('mongoose');
const crypto = require('crypto');

const paymentSchema = new mongoose.Schema(
  {
    sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
    receiptNo: { type: String, required: true, unique: true, trim: true },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, enum: ['cash', 'transfer', 'pos', 'other'], default: 'cash' },
    reference: { type: String, trim: true, maxlength: 100 },
    paidAt: { type: Date, required: true, default: Date.now },
    // The share link. 16 random bytes, so it cannot be guessed or enumerated.
    publicToken: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    voidedAt: { type: Date, default: null },
    voidReason: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

paymentSchema.index({ sale: 1, paidAt: 1 });

paymentSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Payment', paymentSchema);
