const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  game_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  org_game_id: { type: mongoose.Schema.Types.ObjectId, ref: 'OrganizationGame', required: true },
  status: { type: String, enum: ['started', 'in_progress', 'completed', 'abandoned'], default: 'started' },
  started_at: { type: Date, default: Date.now },
  ended_at: { type: Date },
  duration_seconds: { type: Number },
  ip_address: { type: String },
  user_agent: { type: String },
  game_result: { type: mongoose.Schema.Types.Mixed }, // Game-specific result data
  reward_given: { type: Boolean, default: false },
  coupon_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  feedback: {
    game_rating: { type: Number, min: 1, max: 5 },
    offer_rating: { type: Number, min: 1, max: 5 },
    enjoyment_rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    submitted_at: { type: Date },
  },
}, { timestamps: true });

module.exports = mongoose.model('GameSession', gameSessionSchema);
