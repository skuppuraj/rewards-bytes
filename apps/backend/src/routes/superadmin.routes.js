const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const SuperAdmin     = require('../models/SuperAdmin');
const Organization   = require('../models/Organization');
const User           = require('../models/User');
const Customer       = require('../models/Customer');
const GameSession    = require('../models/GameSession');
const OrgGame        = require('../models/OrgGame');
const Offer          = require('../models/Offer');
const Coupon         = require('../models/Coupon');
const Plan           = require('../models/Plan');
const RazorpayConfig = require('../models/RazorpayConfig');

function superAdminAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    req.superAdmin = decoded;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

// ── Auth ────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await SuperAdmin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'superadmin' },
      process.env.JWT_SECRET, { expiresIn: '1d' }
    );
    res.json({ token, admin: { name: admin.name, email: admin.email } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Organizations ──────────────────────────────────────────────────────────────
router.get('/organizations', superAdminAuth, async (req, res) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 }).lean();
    const enriched = await Promise.all(orgs.map(async org => {
      const id = org._id;
      const [customers, gamesPlayed, gamesWon, gamesLost, gamesEnabled, offersCreated, offersRedeemed, users] =
        await Promise.all([
          Customer.countDocuments({ organizationId: id }),
          GameSession.countDocuments({ organizationId: id, status: 'completed' }),
          GameSession.countDocuments({ organizationId: id, status: 'completed', couponId: { $exists: true, $ne: null } }),
          GameSession.countDocuments({ organizationId: id, status: 'completed', couponId: { $exists: false } }),
          OrgGame.countDocuments({ organizationId: id, isEnabled: true }),
          Offer.countDocuments({ organizationId: id }),
          Coupon.countDocuments({ organizationId: id, status: 'redeemed' }),
          User.countDocuments({ organizationId: id }),
        ]);
      return { ...org, stats: { customers, gamesPlayed, gamesWon, gamesLost, gamesEnabled, offersCreated, offersRedeemed, users } };
    }));
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/organizations/:id', superAdminAuth, async (req, res) => {
  try {
    const { isVerified, plan } = req.body;
    const update = {};
    if (isVerified !== undefined) update.isVerified = isVerified;
    if (plan) update.plan = plan;
    const org = await Organization.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json(org);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Plans CRUD ───────────────────────────────────────────────────────────────────
router.get('/plans', superAdminAuth, async (req, res) => {
  try { res.json(await Plan.find().sort({ price: 1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/plans', superAdminAuth, async (req, res) => {
  try {
    const plan = await Plan.create(req.body);
    res.status(201).json(plan);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/plans/:id', superAdminAuth, async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/plans/:id', superAdminAuth, async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Razorpay Config ────────────────────────────────────────────────────────────
router.get('/razorpay-config', superAdminAuth, async (req, res) => {
  try {
    const cfg = await RazorpayConfig.findOne() || {};
    // Mask secrets partially
    const mask = s => s ? s.slice(0, 6) + '••••••••' : '';
    res.json({
      mode:          cfg.mode          || 'test',
      testKeyId:     cfg.testKeyId     || '',
      testKeySecret: mask(cfg.testKeySecret),
      liveKeyId:     cfg.liveKeyId     || '',
      liveKeySecret: mask(cfg.liveKeySecret),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/razorpay-config', superAdminAuth, async (req, res) => {
  try {
    const { mode, testKeyId, testKeySecret, liveKeyId, liveKeySecret } = req.body;
    const update = { mode, updatedAt: new Date() };
    if (testKeyId)     update.testKeyId     = testKeyId;
    if (testKeySecret && !testKeySecret.includes('••')) update.testKeySecret = testKeySecret;
    if (liveKeyId)     update.liveKeyId     = liveKeyId;
    if (liveKeySecret && !liveKeySecret.includes('••')) update.liveKeySecret = liveKeySecret;
    const cfg = await RazorpayConfig.findOneAndUpdate({}, update, { new: true, upsert: true });
    res.json({ success: true, mode: cfg.mode });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
