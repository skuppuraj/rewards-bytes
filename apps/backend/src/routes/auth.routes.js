const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const Organization = require('../models/Organization');
const User = require('../models/User');
const OrgSettings = require('../models/OrgSettings');

// ── Mailer ────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function sendVerificationEmail(toEmail, orgName, token) {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"RewardBytes" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Verify your RewardBytes account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#6366f1;margin-bottom:8px">Welcome to RewardBytes!</h2>
        <p style="color:#374151">Hi <strong>${orgName}</strong>,</p>
        <p style="color:#6b7280">Click the button below to verify your email address and activate your account.</p>
        <a href="${verifyUrl}"
           style="display:inline-block;margin:24px 0;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Verify Email
        </a>
        <p style="color:#9ca3af;font-size:12px">Or copy this link:<br/>${verifyUrl}</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
      </div>
    `,
  });
}

// ── POST /auth/signup ─────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { orgName, email, password } = req.body;
    if (!orgName || !email || !password)
      return res.status(400).json({ error: 'All fields are required' });

    const existing = await Organization.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const slug = orgName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const org = await Organization.create({ name: orgName, slug, email, verificationToken });
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ organizationId: org._id, name: orgName, email, password: hashed, role: 'owner' });
    await OrgSettings.create({ organizationId: org._id });

    // Send verification email (non-blocking — don't fail signup if mail fails)
    try {
      await sendVerificationEmail(email, orgName, verificationToken);
    } catch (mailErr) {
      console.error('Verification email failed:', mailErr.message);
    }

    res.status(201).json({ message: 'Account created. Please verify your email.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── GET /auth/verify-email?token=xxx ─────────────────────────────────────────
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token is required' });
    const org = await Organization.findOneAndUpdate(
      { verificationToken: token },
      { isVerified: true, verificationToken: null },
      { new: true }
    );
    if (!org) return res.status(400).json({ error: 'Invalid or expired verification link' });
    res.json({ message: 'Email verified successfully!', orgName: org.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/resend-verification ───────────────────────────────────────────
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const org = await Organization.findOne({ email });
    if (!org) return res.status(404).json({ error: 'Email not found' });
    if (org.isVerified) return res.status(400).json({ error: 'Email already verified' });

    const verificationToken = crypto.randomBytes(32).toString('hex');
    org.verificationToken = verificationToken;
    await org.save();

    await sendVerificationEmail(email, org.name, verificationToken);
    res.json({ message: 'Verification email resent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('organizationId');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ error: 'Account is deactivated' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    // Block login if email not verified
    if (!user.organizationId?.isVerified)
      return res.status(403).json({ error: 'EMAIL_NOT_VERIFIED', email });

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
