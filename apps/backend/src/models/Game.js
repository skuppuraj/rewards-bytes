const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['spin_wheel', 'scratch_card', 'quiz', 'points_tap'], required: true },
  config: { type: mongoose.Schema.Types.Mixed },
  pointsPerPlay: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
