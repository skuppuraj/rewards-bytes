const mongoose = require('mongoose');

// Per-organization game configuration
const orgGameSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  isEnabled: { type: Boolean, default: false },
  assignedOffers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }],
  timerMinutes: { type: Number, default: 0 }, // 0 = no timer
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

orgGameSchema.index({ organizationId: 1, gameId: 1 }, { unique: true });
module.exports = mongoose.model('OrgGame', orgGameSchema);
