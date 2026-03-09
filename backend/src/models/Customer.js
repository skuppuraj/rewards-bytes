const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  whatsapp_verified: { type: Boolean, default: false },
  total_games_played: { type: Number, default: 0 },
  total_offers_obtained: { type: Number, default: 0 },
  last_played_at: { type: Date },
  last_ip: { type: String },
}, { timestamps: true });

customerSchema.index({ organization_id: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Customer', customerSchema);
