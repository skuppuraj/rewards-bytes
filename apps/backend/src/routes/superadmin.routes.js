const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SuperAdmin  = require('../models/SuperAdmin');
const Organization = require('../models/Organization');
const User         = require('../models/User');
const Customer     = require('../models/Customer');
const GameSession  = require('../models/GameSession');
const OrgGame      = require('../models/OrgGame');
const Offer        = require('../models/Offer');
const Coupon       = require('../models/Coupon');

// ── Middleware ──────────────────────────────────────────────────────────────
function superAdminAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    req.superAdmin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── POST /superadmin/login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await SuperAdmin.findOne({ email });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'superadmin' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ token, admin: { name: admin.name, email: admin.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /superadmin/organizations ──────────────────────────────────────────
router.get('/organizations', superAdminAuth, async (req, res) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 }).lean();

    const enriched = await Promise.all(orgs.map(async org => {
      const id = org._id;

      const [
        customers,
        gamesPlayed,
        gamesWon,
        gamesLost,
        gamesEnabled,
        offersCreated,
        offersRedeemed,
        users,
      ] = await Promise.all([
        // Customers registered
        Customer.countDocuments({ organizationId: id }),

        // Total completed game sessions
        GameSession.countDocuments({ organizationId: id, status: 'completed' }),

        // Won = completed session that has a coupon attached (offer was won)
        GameSession.countDocuments({ organizationId: id, status: 'completed', couponId: { $exists: true, $ne: null } }),

        // Lost = completed session with no coupon (played but didn't win)
        GameSession.countDocuments({ organizationId: id, status: 'completed', couponId: { $exists: false } }),

        // Games enabled for this org
        OrgGame.countDocuments({ organizationId: id, isEnabled: true }),

        // Offers created
        Offer.countDocuments({ organizationId: id }),

        // Coupons redeemed
        Coupon.countDocuments({ organizationId: id, status: 'redeemed' }),

        // Staff/admin users
        User.countDocuments({ organizationId: id }),
      ]);

      return {
        ...org,
        stats: {
          customers,
          gamesPlayed,
          gamesWon,
          gamesLost,
          gamesEnabled,
          offersCreated,
          offersRedeemed,
          users,
        },
      };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /superadmin/organizations/:id ────────────────────────────────────
router.patch('/organizations/:id', superAdminAuth, async (req, res) => {
  try {
    const { isVerified, plan } = req.body;
    const update = {};
    if (isVerified !== undefined) update.isVerified = isVerified;
    if (plan) update.plan = plan;
    const org = await Organization.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
