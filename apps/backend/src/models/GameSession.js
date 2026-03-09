const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  orgGameId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgGame', required: true },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  ipAddress: String,
  deviceAgent: String,
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  result: { type: mongoose.Schema.Types.Mixed }, // game-specific result data
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  feedback: {
    gameRating: Number,
    offerRating: Number,
    enjoymentRating: Number,
    comment: String,
    submittedAt: Date
  }
});

gameSessionSchema.index({ organizationId: 1, customerId: 1 });
gameSessionSchema.index({ organizationId: 1, startedAt: -1 });
module.exports = mongoose.model('GameSession', gameSessionSchema);
