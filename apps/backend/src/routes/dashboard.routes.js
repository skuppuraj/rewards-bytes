const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const GameSession = require('../models/GameSession');
const Coupon = require('../models/Coupon');
const Customer = require('../models/Customer');
const OrgGame = require('../models/OrgGame');

router.get('/stats', auth, async (req, res) => {
  try {
    const orgId = req.orgId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalCustomers, gamesToday, offersRedeemed, totalCoupons, activeCoupons] = await Promise.all([
      Customer.countDocuments({ organizationId: orgId }),
      GameSession.countDocuments({ organizationId: orgId, startedAt: { $gte: today, $lt: tomorrow }, status: 'completed' }),
      Coupon.countDocuments({ organizationId: orgId, status: 'redeemed' }),
      Coupon.countDocuments({ organizationId: orgId }),
      Coupon.countDocuments({ organizationId: orgId, status: 'active' })
    ]);

    // Conversion rate = redeemed / total coupons
    const conversionRate = totalCoupons > 0 ? ((offersRedeemed / totalCoupons) * 100).toFixed(1) : 0;

    res.json({ totalCustomers, gamesToday, offersRedeemed, totalCoupons, activeCoupons, conversionRate: parseFloat(conversionRate) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Weekly games played chart data (last 7 days)
router.get('/chart/games-per-day', auth, async (req, res) => {
  try {
    const days = 7;
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const from = new Date();
      from.setDate(from.getDate() - i);
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(to.getDate() + 1);
      const count = await GameSession.countDocuments({
        organizationId: req.orgId,
        startedAt: { $gte: from, $lt: to },
        status: 'completed'
      });
      result.push({
        date: from.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        games: count
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Coupon status distribution (for pie chart)
router.get('/chart/coupon-status', auth, async (req, res) => {
  try {
    const [active, redeemed, expired] = await Promise.all([
      Coupon.countDocuments({ organizationId: req.orgId, status: 'active' }),
      Coupon.countDocuments({ organizationId: req.orgId, status: 'redeemed' }),
      Coupon.countDocuments({ organizationId: req.orgId, status: 'expired' })
    ]);
    res.json([{ label: 'Active', value: active }, { label: 'Redeemed', value: redeemed }, { label: 'Expired', value: expired }]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
