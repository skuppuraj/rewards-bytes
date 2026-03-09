const mongoose = require('mongoose');

const fraudLogSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  phone: String,
  ipAddress: String,
  deviceAgent: String,
  playDate: { type: String, required: true }, // YYYY-MM-DD
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  createdAt: { type: Date, default: Date.now }
});

fraudLogSchema.index({ organizationId: 1, phone: 1, playDate: 1 });
fraudLogSchema.index({ organizationId: 1, ipAddress: 1, playDate: 1 });
module.exports = mongoose.model('FraudLog', fraudLogSchema);
