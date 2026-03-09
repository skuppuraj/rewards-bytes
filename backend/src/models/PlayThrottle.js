const mongoose = require('mongoose');

const playThrottleSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  game_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  phone: { type: String },
  ip_address: { type: String },
  played_date: { type: String }, // YYYY-MM-DD
  play_count: { type: Number, default: 1 },
}, { timestamps: true });

playThrottleSchema.index({ organization_id: 1, game_id: 1, phone: 1, played_date: 1 });
playThrottleSchema.index({ organization_id: 1, game_id: 1, ip_address: 1, played_date: 1 });

module.exports = mongoose.model('PlayThrottle', playThrottleSchema);
