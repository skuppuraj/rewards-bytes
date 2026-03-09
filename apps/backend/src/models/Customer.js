const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  marketingConsent: { type: Boolean, default: false },
  totalGamesPlayed: { type: Number, default: 0 },
  totalOffersObtained: { type: Number, default: 0 },
  totalOffersRedeemed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

customerSchema.index({ organizationId: 1, phone: 1 }, { unique: true });
module.exports = mongoose.model('Customer', customerSchema);
