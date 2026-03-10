const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const superAdminAuth = require('../middleware/superAdminAuth.middleware');
const Organization   = require('../models/Organization');
const Plan           = require('../models/Plan');
const Subscription   = require('../models/Subscription');
const RazorpayConfig = require('../models/RazorpayConfig');

// POST /superadmin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email    !== process.env.SUPER_ADMIN_EMAIL ||
      password !== process.env.SUPER_ADMIN_PASSWORD
    ) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ superAdmin: true }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, email });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /superadmin/organizations — list all orgs with active subscription
router.get('/organizations', superAdminAuth, async (req, res) => {
  try {
    const orgs   = await Organization.find().sort({ createdAt: -1 }).lean();
    const orgIds = orgs.map(o => o._id);

    const subs = await Subscription.find({
      organizationId: { $in: orgIds },
      status: 'active',
    }).populate('planId', 'name price durationDays').lean();

    const subMap = {};
    subs.forEach(s => { subMap[String(s.organizationId)] = s; });

    res.json(orgs.map(org => ({ ...org, activeSub: subMap[String(org._id)] || null })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /superadmin/purchase-stats
router.get('/purchase-stats', superAdminAuth, async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalPaid, todayPaid] = await Promise.all([
      Subscription.find({ status: 'active', isTrial: false }).lean(),
      Subscription.find({ status: 'active', isTrial: false, startDate: { $gte: todayStart } }).lean(),
    ]);

    res.json({
      totalPurchases: totalPaid.length,
      todayPurchases: todayPaid.length,
      totalRevenue:   totalPaid.reduce((a, s) => a + (s.amount || 0), 0),
      todayRevenue:   todayPaid.reduce((a, s) => a + (s.amount || 0), 0),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /superadmin/organizations/:id
router.patch('/organizations/:id', superAdminAuth, async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(org);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Plans CRUD ──────────────────────────────────────────────────
router.get   ('/plans',     superAdminAuth, async (req, res) => {
  try { res.json(await Plan.find().sort({ createdAt: -1 })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post  ('/plans',     superAdminAuth, async (req, res) => {
  try { res.status(201).json(await Plan.create(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.put   ('/plans/:id', superAdminAuth, async (req, res) => {
  try { res.json(await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/plans/:id', superAdminAuth, async (req, res) => {
  try { await Plan.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Razorpay Config ─────────────────────────────────────────────
router.get('/razorpay-config', superAdminAuth, async (req, res) => {
  try {
    const cfg = await RazorpayConfig.findOne();
    if (!cfg) return res.json({});
    res.json({
      mode:       cfg.mode,
      testKeyId:  cfg.testKeyId,
      liveKeyId:  cfg.liveKeyId,
      testSecret: cfg.testKeySecret ? '••••••••' : '',
      liveSecret: cfg.liveKeySecret ? '••••••••' : '',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/razorpay-config', superAdminAuth, async (req, res) => {
  try {
    const { mode, testKeyId, testKeySecret, liveKeyId, liveKeySecret } = req.body;
    const update = { mode };
    if (testKeyId)     update.testKeyId     = testKeyId;
    if (testKeySecret) update.testKeySecret = testKeySecret;
    if (liveKeyId)     update.liveKeyId     = liveKeyId;
    if (liveKeySecret) update.liveKeySecret = liveKeySecret;
    const cfg = await RazorpayConfig.findOneAndUpdate({}, update, { upsert: true, new: true });
    res.json({ success: true, mode: cfg.mode });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
