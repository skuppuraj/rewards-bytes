const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const superAdminAuth = require('../middleware/superAdminAuth.middleware');
const SuperAdmin     = require('../models/SuperAdmin');
const Organization   = require('../models/Organization');
const Plan           = require('../models/Plan');
const Subscription   = require('../models/Subscription');
const RazorpayConfig = require('../models/RazorpayConfig');
const Customer       = require('../models/Customer');
const GameSession    = require('../models/GameSession');
const OrgGame        = require('../models/OrgGame');
const Offer          = require('../models/Offer');
const User           = require('../models/User');

// POST /superadmin/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await SuperAdmin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { superAdmin: true, id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, email: admin.email, name: admin.name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /superadmin/organizations — with live stats
router.get('/organizations', superAdminAuth, async (req, res) => {
  try {
    const orgs   = await Organization.find().sort({ createdAt: -1 }).lean();
    const orgIds = orgs.map(o => o._id);

    // Run all aggregations in parallel
    const [
      customerCounts,
      sessionAgg,
      offerCounts,
      userCounts,
      subs,
    ] = await Promise.all([
      // customers per org
      Customer.aggregate([
        { $match: { organizationId: { $in: orgIds } } },
        { $group: { _id: '$organizationId', count: { $sum: 1 } } },
      ]),
      // games played / won / lost per org
      GameSession.aggregate([
        { $match: { organizationId: { $in: orgIds }, status: 'completed' } },
        { $group: {
          _id: '$organizationId',
          gamesPlayed: { $sum: 1 },
          gamesWon:    { $sum: { $cond: [{ $eq: ['$result.won', true] }, 1, 0] } },
          gamesLost:   { $sum: { $cond: [{ $eq: ['$result.won', false] }, 1, 0] } },
          offersObtained: { $sum: { $cond: [{ $ifNull: ['$offerId', false] }, 1, 0] } },
        }},
      ]),
      // offers created per org
      Offer.aggregate([
        { $match: { organizationId: { $in: orgIds } } },
        { $group: { _id: '$organizationId', count: { $sum: 1 } } },
      ]),
      // staff users per org
      User.aggregate([
        { $match: { organizationId: { $in: orgIds } } },
        { $group: { _id: '$organizationId', count: { $sum: 1 } } },
      ]),
      // active subscriptions
      Subscription.find({
        organizationId: { $in: orgIds }, status: 'active',
      }).populate('planId', 'name price durationDays').lean(),
    ]);

    // Build lookup maps
    const custMap    = Object.fromEntries(customerCounts.map(r => [String(r._id), r.count]));
    const sessionMap = Object.fromEntries(sessionAgg.map(r => [String(r._id), r]));
    const offerMap   = Object.fromEntries(offerCounts.map(r => [String(r._id), r.count]));
    const userMap    = Object.fromEntries(userCounts.map(r => [String(r._id), r.count]));
    const subMap     = Object.fromEntries(subs.map(s => [String(s.organizationId), s]));

    const result = orgs.map(org => {
      const id  = String(org._id);
      const ses = sessionMap[id] || {};
      return {
        ...org,
        activeSub: subMap[id] || null,
        stats: {
          customers:      custMap[id]       || 0,
          gamesPlayed:    ses.gamesPlayed   || 0,
          gamesWon:       ses.gamesWon      || 0,
          gamesLost:      ses.gamesLost     || 0,
          offersCreated:  offerMap[id]      || 0,
          offersRedeemed: ses.offersObtained|| 0,
          users:          userMap[id]       || 0,
        },
      };
    });

    res.json(result);
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

// ── Plans CRUD ──────────────────────────────────────────────────────────────
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

// ── Razorpay Config ─────────────────────────────────────────────────────────
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
