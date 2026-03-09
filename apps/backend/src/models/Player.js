const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  totalPoints: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [String],
  createdAt: { type: Date, default: Date.now }
});

playerSchema.index({ organizationId: 1 });
module.exports = mongoose.model('Player', playerSchema);
