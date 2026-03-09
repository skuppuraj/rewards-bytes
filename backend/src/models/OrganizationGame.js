const mongoose = require('mongoose');

const orgGameSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  game_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  is_enabled: { type: Boolean, default: false },
  timer_minutes: { type: Number, default: 0 }, // 0 = no timer
  assigned_offers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }],
  setup_completed: { type: Boolean, default: false },
}, { timestamps: true });

orgGameSchema.index({ organization_id: 1, game_id: 1 }, { unique: true });

module.exports = mongoose.model('OrganizationGame', orgGameSchema);
