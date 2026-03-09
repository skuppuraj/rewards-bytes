const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  logo: { type: String },
  background_image: { type: String },
  font_style: { type: String, default: 'Inter' },
  button_color: { type: String, default: '#6366f1' },
  text_color: { type: String, default: '#111827' },
  website: { type: String },
  social_handles: {
    instagram: String,
    facebook: String,
    twitter: String,
    whatsapp: String,
  },
  settings: {
    whatsapp_otp_enabled: { type: Boolean, default: true },
    marketing_consent: { type: Boolean, default: true },
    one_play_per_day: { type: Boolean, default: true },
    one_play_per_ip: { type: Boolean, default: true },
    feedback_enabled: { type: Boolean, default: true },
    review_link: { type: String },
  },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
