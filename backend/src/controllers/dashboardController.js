const GameSession = require('../models/GameSession');
const Coupon = require('../models/Coupon');
const Customer = require('../models/Customer');

exports.getStats = async (req, res) => {
  const orgId = req.user.organization_id;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

  try {
    const [gamesPlayedToday, offersRedeemedToday, totalCustomers, totalCoupons, totalGamesAllTime] = await Promise.all([
      GameSession.countDocuments({ organization_id: orgId, status: 'completed', ended_at: { $gte: todayStart, $lte: todayEnd } }),
      Coupon.countDocuments({ organization_id: orgId, status: 'redeemed', redeemed_at: { $gte: todayStart, $lte: todayEnd } }),
      Customer.countDocuments({ organization_id: orgId }),
      Coupon.countDocuments({ organization_id: orgId, status: { $ne: 'deleted' } }),
      GameSession.countDocuments({ organization_id: orgId, status: 'completed' }),
    ]);

    const conversionRate = totalGamesAllTime > 0
      ? ((await Coupon.countDocuments({ organization_id: orgId })) / totalGamesAllTime * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        games_played_today: gamesPlayedToday,
        offers_redeemed_today: offersRedeemedToday,
        total_customers: totalCustomers,
        total_coupons: totalCoupons,
        conversion_rate: conversionRate,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
