const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  price:        { type: Number, required: true },           // INR paise (0 = free/trial)
  durationDays: { type: Number, required: true },           // validity in days
  isTrial:      { type: Boolean, default: false },
  trialDays:    { type: Number, default: 0 },               // used only if isTrial
  isActive:     { type: Boolean, default: true },
  description:  { type: String, default: '' },
  features:     [{ type: String }],                         // bullet list for display
  createdAt:    { type: Date, default: Date.now },
});

module.exports = mongoose.model('Plan', planSchema);
