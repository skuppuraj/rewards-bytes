const router = require('express').Router();
const auth = require('../middleware/tenant.middleware');
const Coupon = require('../models/Coupon');
const Player = require('../models/Player');

router.get('/', auth, async (req, res) => {
  try {
    const coupons = await Coupon.find({ organizationId: req.orgId });
    res.json(coupons);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { code, description, pointsRequired, discountType, discountValue, expiresAt, usageLimit } = req.body;
    const coupon = await Coupon.create({
      organizationId: req.orgId, code, description, pointsRequired,
      discountType, discountValue, expiresAt, usageLimit
    });
    res.status(201).json(coupon);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.orgId },
      req.body, { new: true }
    );
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    res.json(coupon);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Coupon.findOneAndDelete({ _id: req.params.id, organizationId: req.orgId });
    res.json({ message: 'Coupon deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/redeem', auth, async (req, res) => {
  try {
    const { code, playerId } = req.body;
    const coupon = await Coupon.findOne({ code, organizationId: req.orgId, isActive: true });
    if (!coupon) return res.status(404).json({ error: 'Invalid or inactive coupon' });
    if (coupon.expiresAt && new Date() > coupon.expiresAt)
      return res.status(400).json({ error: 'Coupon has expired' });
    if (coupon.usedCount >= coupon.usageLimit)
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    const player = await Player.findOne({ _id: playerId, organizationId: req.orgId });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    if (player.totalPoints < coupon.pointsRequired)
      return res.status(400).json({ error: `Insufficient points. Need ${coupon.pointsRequired} pts.` });
    await Player.findByIdAndUpdate(playerId, { $inc: { totalPoints: -coupon.pointsRequired } });
    await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
    res.json({
      message: 'Coupon redeemed successfully!',
      discount: `${coupon.discountValue}${coupon.discountType === 'percent' ? '%' : ' flat'} off`,
      pointsDeducted: coupon.pointsRequired
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
