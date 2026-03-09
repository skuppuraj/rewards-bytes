const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['owner', 'admin', 'staff'], default: 'owner' },
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ email: 1, organizationId: 1 }, { unique: true });
module.exports = mongoose.model('User', userSchema);
