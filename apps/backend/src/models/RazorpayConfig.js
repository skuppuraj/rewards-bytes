const mongoose = require('mongoose');

const razorpayConfigSchema = new mongoose.Schema({
  mode:      { type: String, enum: ['test', 'live'], default: 'test' },
  testKeyId:     { type: String, default: '' },
  testKeySecret: { type: String, default: '' },
  liveKeyId:     { type: String, default: '' },
  liveKeySecret: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('RazorpayConfig', razorpayConfigSchema);
