const crypto = require('crypto');
const OtpLog = require('../models/OtpLog');
const { sendOtp } = require('./whatsapp');

// Generate and send OTP
exports.generateAndSendOtp = async (phone) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  // Invalidate old OTPs for this phone
  await OtpLog.deleteMany({ phone });

  await OtpLog.create({ phone, otp, expiresAt });
  await sendOtp(phone, otp);

  return true;
};

// Verify OTP
exports.verifyOtp = async (phone, otp) => {
  const record = await OtpLog.findOne({ phone, verified: false });
  if (!record) return { valid: false, reason: 'OTP not found or expired' };
  if (new Date() > record.expiresAt) return { valid: false, reason: 'OTP expired' };
  if (record.otp !== otp) return { valid: false, reason: 'Invalid OTP' };

  record.verified = true;
  await record.save();
  return { valid: true };
};
