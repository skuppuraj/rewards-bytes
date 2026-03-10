const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Customer = require('../models/Customer');
const GameSession = require('../models/GameSession');

// ── Middleware: verify super admin JWT ──────────────────────────────────
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

// ── POST /superadmin/login ─────────────────────────────────────────────────
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

// ── GET /superadmin/organizations ───────────────────────────────────────────
router.get('/organizations', superAdminAuth, async (req, res) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 }).lean();

    // Enrich each org with counts
    const enriched = await Promise.all(orgs.map(async org => {
      const [customers, gameSessions, users] = await Promise.all([
        Customer.countDocuments({ organizationId: org._id }),
        GameSession.countDocuments({ organizationId: org._id }),
        User.countDocuments({ organizationId: org._id }),
      ]);
      return { ...org, stats: { customers, gameSessions, users } };
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /superadmin/organizations/:id ────────────────────────────────────
// Toggle verified status or update plan
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
