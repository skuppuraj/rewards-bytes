const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  code: { type: String, required: true },
  description: String,
  pointsRequired: { type: Number, required: true },
  discountType: { type: String, enum: ['percent', 'flat'], required: true },
  discountValue: { type: Number, required: true },
  expiresAt: Date,
  isActive: { type: Boolean, default: true },
  usageLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 }
});

couponSchema.index({ organizationId: 1, code: 1 }, { unique: true });
module.exports = mongoose.model('Coupon', couponSchema);
