const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const Coupon = require('../models/Coupon');
const Customer = require('../models/Customer');
const { redeemCoupon } = require('../engines/couponEngine');
const { sendNotification } = require('../utils/whatsapp');

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    const code = req.query.code || '';
    const name = req.query.name || '';
    const mobile = req.query.mobile || '';
    const status = req.query.status || '';

    let customerIds;
    if (name || mobile) {
      const q = { organizationId: req.orgId };
      if (name) q.name = { $regex: name, $options: 'i' };
      if (mobile) q.phone = { $regex: mobile, $options: 'i' };
      const customers = await Customer.find(q).select('_id');
      customerIds = customers.map(c => c._id);
    }

    const query = { organizationId: req.orgId };
    if (customerIds) query.customerId = { $in: customerIds };
    if (code) query.code = { $regex: code, $options: 'i' };
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = from;
      if (to) query.createdAt.$lte = to;
    }

    // Auto-expire before fetching
    await Coupon.updateMany({ organizationId: req.orgId, status: 'active', expiresAt: { $lt: new Date() } }, { status: 'expired' });

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .populate('customerId', 'name phone')
        .populate('offerId', 'name discountType discountValue')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Coupon.countDocuments(query)
    ]);

    res.json({ coupons, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Redeem coupon
router.post('/:id/redeem', auth, async (req, res) => {
  try {
    const coupon = await redeemCoupon({ couponId: req.params.id, redeemedBy: req.user.userId });
    // Update customer redeemed count
    await Customer.findByIdAndUpdate(coupon.customerId, { $inc: { totalOffersRedeemed: 1 } });
    res.json({ message: 'Coupon redeemed successfully', coupon });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Update validity (extend)
router.patch('/:id', auth, async (req, res) => {
  try {
    const { additionalDays } = req.body;
    const coupon = await Coupon.findOne({ _id: req.params.id, organizationId: req.orgId });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    if (additionalDays) {
      const newExpiry = new Date(coupon.expiresAt);
      newExpiry.setDate(newExpiry.getDate() + parseInt(additionalDays));
      coupon.expiresAt = newExpiry;
      if (coupon.status === 'expired') coupon.status = 'active';
    }
    await coupon.save();
    res.json(coupon);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Send WhatsApp notification
router.post('/:id/notify', auth, async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, organizationId: req.orgId }).populate('customerId', 'name phone');
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    const message = req.body.message || `Hi ${coupon.customerId.name}, your coupon code *${coupon.code}* is still active! Use it before ${new Date(coupon.expiresAt).toLocaleDateString()}.`;
    await sendNotification(coupon.customerId.phone, message);
    res.json({ message: 'Notification sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete coupon
router.delete('/:id', auth, async (req, res) => {
  try {
    await Coupon.findOneAndDelete({ _id: req.params.id, organizationId: req.orgId });
    res.json({ message: 'Coupon deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
