const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // System-level game template (shared across all orgs)
  key: { type: String, required: true, unique: true }, // e.g. 'spin_wheel'
  name: { type: String, required: true },
  shortDescription: { type: String },
  fullDescription: { type: String },
  imageUrl: String,
  videoDemoUrl: String,
  rules: [String],
  isSystemGame: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Game', gameSchema);
