const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const GameSession = require('../models/GameSession');
const Customer = require('../models/Customer');

// GET /feedback — paginated list of sessions that have feedback
router.get('/', auth, async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const from   = req.query.from ? new Date(req.query.from) : null;
    const to     = req.query.to   ? new Date(req.query.to + 'T23:59:59') : null;

    // Resolve customer IDs for search
    let customerFilter = {};
    if (search) {
      const customers = await Customer.find({
        organizationId: req.orgId,
        $or: [
          { name:  { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      customerFilter = { customerId: { $in: customers.map(c => c._id) } };
    }

    const dateFilter = {};
    if (from || to) {
      dateFilter['feedback.submittedAt'] = {};
      if (from) dateFilter['feedback.submittedAt'].$gte = from;
      if (to)   dateFilter['feedback.submittedAt'].$lte = to;
    }

    const query = {
      organizationId: req.orgId,
      'feedback.submittedAt': { $exists: true },
      ...customerFilter,
      ...dateFilter
    };

    const total = await GameSession.countDocuments(query);

    const sessions = await GameSession.find(query)
      .populate('customerId', 'name phone')
      .populate('gameId',     'name key')
      .sort({ 'feedback.submittedAt': -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      reviews: sessions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
