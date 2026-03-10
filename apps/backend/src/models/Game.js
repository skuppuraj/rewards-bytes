const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  key:              { type: String, required: true, unique: true },
  name:             { type: String, required: true },
  shortDescription: { type: String },
  fullDescription:  { type: String },
  imageUrl:         String,
  videoDemoUrl:     String,
  rules:            [String],
  isSystemGame:     { type: Boolean, default: true },
  // Marketplace metadata
  category:         { type: String, default: 'lucky' },   // lucky | arcade | puzzle | trivia
  orgTypes:         [{ type: String }],                   // saloon | cafe | restaurant | others
  isNewLaunch:      { type: Boolean, default: false },
  createdAt:        { type: Date, default: Date.now },
});

module.exports = mongoose.model('Game', gameSchema);
