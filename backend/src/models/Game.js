const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  // Global game template (created by platform admin)
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  short_description: { type: String },
  full_description: { type: String },
  image: { type: String },
  demo_video_url: { type: String },
  rules: [{ type: String }],
  game_type: { type: String, enum: ['spin_wheel', 'scratch_card', 'quiz', 'puzzle', 'memory'], default: 'spin_wheel' },
  is_published: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Game', gameSchema);
