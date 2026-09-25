const mongoose = require('mongoose');
const { computeTotals, lineTotal, deriveStatus } = require('../utils/money');

const saleItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 200 },
    // Set when the admin picked an existing course rather than typing a line.
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, default: 0 },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    saleNo: { type: String, required: true, unique: true, trim: true },
    customer: {
      fullName: { type: String, required: true, trim: true, maxlength: 100 },
      phone: { type: String, required: true, trim: true },
      // Optional: set only when the buyer is a registered student, and the only
      // thing that puts this sale on their dashboard.
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    },
    items: {
      type: [saleItemSchema],
      validate: [
        { validator: (v) => v.length >= 1, message: 'A sale needs at least one item' },
        { validator: (v) => v.length <= 20, message: 'A sale cannot have more than 20 items' },
      ],
    },
    discount: {
      type: { type: String, enum: ['amount', 'percent'], default: 'amount' },
      value: { type: Number, default: 0, min: 0 },
      reason: { type: String, trim: true, maxlength: 200 },
    },
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    // Maintained by services/sales.service.js from the surviving Payment rows —
    // never incremented in place.
    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['unpaid', 'part_paid', 'paid', 'void'],
      default: 'unpaid',
      index: true,
    },
    notes: { type: String, trim: true, maxlength: 500 },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    voidedAt: { type: Date, default: null },
    voidReason: { type: String, trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

// Totals are derived here and nowhere else, so a sale saved by any route ends
// up with figures that match its own items.
saleSchema.pre('validate', function () {
  this.items.forEach((item) => {
    item.lineTotal = lineTotal(item);
  });
  const { subtotal, discountAmount, total } = computeTotals(this.items, this.discount);
  this.subtotal = subtotal;
  this.discountAmount = discountAmount;
  this.total = total;
  this.balance = Math.max(total - (this.amountPaid || 0), 0);
  this.status = deriveStatus({ total, amountPaid: this.amountPaid || 0, voided: !!this.voidedAt });
});

saleSchema.index({ 'customer.student': 1, createdAt: -1 });
saleSchema.index({ 'customer.phone': 1 });
saleSchema.index({ status: 1, createdAt: -1 });

saleSchema.set('toJSON', {
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Sale', saleSchema);
