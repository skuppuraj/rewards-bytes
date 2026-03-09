const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { sendOTPEmail } = require('../services/emailService');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

exports.signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { organization_name, name, email, mobile, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = new User({ name, email, mobile, password, role: 'owner' });
    const otp = user.generateOTP();
    await user.save();

    // Temporarily store org name in a way we can retrieve it after verification
    user.organization_name_pending = organization_name;

    await sendOTPEmail(email, otp, name);

    res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email with the OTP sent.',
      userId: user._id,
      // Store org name in response for frontend to pass back on verify
      organization_name,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { userId, otp, organization_name } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.is_email_verified) return res.status(400).json({ success: false, message: 'Email already verified' });
    if (user.email_otp !== otp || user.email_otp_expires < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Create organization
    const slug = organization_name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    const org = await Organization.create({ name: organization_name, slug, owner_id: user._id });

    user.is_email_verified = true;
    user.email_otp = undefined;
    user.email_otp_expires = undefined;
    user.organization_id = org._id;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, token, user: { ...user.toObject(), password: undefined }, organization: org });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resendOTP = async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const otp = user.generateOTP();
    await user.save();
    await sendOTPEmail(user.email, otp, user.name);
    res.json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.is_email_verified) {
      return res.status(403).json({ success: false, message: 'Please verify your email first' });
    }
    const token = generateToken(user._id);
    res.json({ success: true, token, user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate('organization_id');
  res.json({ success: true, user });
};

exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
