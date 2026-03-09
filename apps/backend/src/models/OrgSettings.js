const mongoose = require('mongoose');

const orgSettingsSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true },
  // Branding
  logoUrl: String,
  backgroundImageUrl: String,
  fontStyle: { type: String, default: 'Inter' },
  primaryButtonColor: { type: String, default: '#6366f1' },
  secondaryButtonColor: { type: String, default: '#8b5cf6' },
  primaryTextColor: { type: String, default: '#111827' },
  secondaryTextColor: { type: String, default: '#6b7280' },
  websiteUrl: String,
  // Social
  socialMedia: {
    instagram: String,
    whatsapp: String,
    twitter: String,
    facebook: String
  },
  googleReviewLink: String,
  // Game Rules
  whatsappOtpEnabled: { type: Boolean, default: true },
  marketingConsentEnabled: { type: Boolean, default: true },
  onePlayPerDayPerPhone: { type: Boolean, default: true },
  onePlayPerIp: { type: Boolean, default: false },
  feedbackEnabled: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('OrgSettings', orgSettingsSchema);
