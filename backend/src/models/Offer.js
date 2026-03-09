const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  short_description: { type: String },
  description: { type: String }, // WYSIWYG HTML
  image: { type: String },
  discount_enabled: { type: Boolean, default: false },
  discount_type: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  discount_value: { type: Number, default: 0 },
  auto_generate_coupon: { type: Boolean, default: true },
  start_date: { type: Date },
  validity_days: { type: Number, default: 30 },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
