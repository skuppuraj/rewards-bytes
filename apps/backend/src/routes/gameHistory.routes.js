const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const GameSession = require('../models/GameSession');
const Customer = require('../models/Customer');

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    // Find customers matching search
    let customerIds;
    if (search) {
      const customers = await Customer.find({
        organizationId: req.orgId,
        $or: [{ name: { $regex: search, $options: 'i' } }, { phone: { $regex: search, $options: 'i' } }]
      }).select('_id');
      customerIds = customers.map(c => c._id);
    }

    const query = { organizationId: req.orgId, status: 'completed' };
    if (customerIds) query.customerId = { $in: customerIds };
    if (from || to) {
      query.startedAt = {};
      if (from) query.startedAt.$gte = from;
      if (to) query.startedAt.$lte = to;
    }

    // Group by customer
    const sessions = await GameSession.find(query)
      .populate('customerId', 'name phone')
      .populate('gameId', 'name key')
      .populate('offerId', 'name discountType discountValue')
      .populate('couponId', 'code status')
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await GameSession.countDocuments(query);

    // Group sessions by customer
    const grouped = {};
    sessions.forEach(s => {
      const cid = s.customerId?._id?.toString();
      if (!cid) return;
      if (!grouped[cid]) {
        grouped[cid] = {
          customer: s.customerId,
          gamesPlayed: 0,
          offersObtained: 0,
          sessions: []
        };
      }
      grouped[cid].gamesPlayed++;
      if (s.offerId) grouped[cid].offersObtained++;
      grouped[cid].sessions.push(s);
    });

    res.json({ history: Object.values(grouped), total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
