const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  offer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
  game_session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' },
  coupon_code: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['active', 'redeemed', 'expired', 'deleted'], default: 'active' },
  start_date: { type: Date, default: Date.now },
  end_date: { type: Date },
  redeemed_at: { type: Date },
  redeemed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Staff user
  validity_days: { type: Number },
  notification_sent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
