const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Organization = require('../models/Organization');
const User = require('../models/User');
const OrgSettings = require('../models/OrgSettings');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

router.post('/signup', async (req, res) => {
  try {
    const { orgName, email, password } = req.body;
    const slug = orgName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const org = await Organization.create({ name: orgName, slug, email, verificationToken });
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ organizationId: org._id, name: orgName, email, password: hashed, role: 'owner' });
    // Create default org settings
    await OrgSettings.create({ organizationId: org._id });
    // Send verification email (optional, skip if no email config)
    res.status(201).json({ message: 'Organization created. Please verify your email.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  const org = await Organization.findOneAndUpdate(
    { verificationToken: token },
    { isVerified: true, verificationToken: null },
    { new: true }
  );
  if (!org) return res.status(400).json({ error: 'Invalid token' });
  res.json({ message: 'Email verified successfully!' });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('organizationId');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ error: 'Account is deactivated' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { userId: user._id, orgId: user.organizationId._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, org: user.organizationId, user: { name: user.name, email: user.email, role: user.role, permissions: user.permissions } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
