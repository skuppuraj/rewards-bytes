const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  organizationId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  planId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId:{ type: String },
  status:          { type: String, enum: ['active', 'expired', 'pending', 'failed'], default: 'pending' },
  startDate:       { type: Date },
  expiresAt:       { type: Date },
  isTrial:         { type: Boolean, default: false },
  amount:          { type: Number },                         // INR paise paid
  createdAt:       { type: Date, default: Date.now },
});

subscriptionSchema.index({ organizationId: 1, status: 1 });
module.exports = mongoose.model('Subscription', subscriptionSchema);
