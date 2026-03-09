const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
  gameSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' },
  code: { type: String, required: true },
  status: { type: String, enum: ['active', 'redeemed', 'expired'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  redeemedAt: Date,
  redeemedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // staff who redeemed
  whatsappSent: { type: Boolean, default: false },
  whatsappSentAt: Date,
  createdAt: { type: Date, default: Date.now }
});

couponSchema.index({ organizationId: 1, code: 1 }, { unique: true });
couponSchema.index({ organizationId: 1, customerId: 1 });
couponSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-mark expired via cron
module.exports = mongoose.model('Coupon', couponSchema);
