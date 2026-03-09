const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  shortDescription: { type: String, required: true },
  description: { type: String }, // WYSIWYG HTML content
  imageUrl: String,
  validityDays: { type: Number, required: true, default: 30 },
  discountType: { type: String, enum: ['percentage', 'flat'], required: true },
  discountValue: { type: Number, required: true },
  autoGenerateCoupon: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

offerSchema.index({ organizationId: 1 });
module.exports = mongoose.model('Offer', offerSchema);
