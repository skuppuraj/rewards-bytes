const router  = require('express').Router();
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const auth     = require('../middleware/auth.middleware');
const Plan         = require('../models/Plan');
const Subscription = require('../models/Subscription');
const RazorpayConfig = require('../models/RazorpayConfig');
const Organization   = require('../models/Organization');

async function getRazorpayInstance() {
  const cfg = await RazorpayConfig.findOne();
  if (!cfg) throw new Error('Razorpay not configured');
  const keyId     = cfg.mode === 'live' ? cfg.liveKeyId     : cfg.testKeyId;
  const keySecret = cfg.mode === 'live' ? cfg.liveKeySecret : cfg.testKeySecret;
  if (!keyId || !keySecret) throw new Error('Razorpay keys not set for ' + cfg.mode + ' mode');
  return { instance: new Razorpay({ key_id: keyId, key_secret: keySecret }), keyId };
}

// GET /subscriptions/active  — current active subscription for org
router.get('/active', auth, async (req, res) => {
  try {
    const sub = await Subscription.findOne({ organizationId: req.orgId, status: 'active' })
      .populate('planId').sort({ expiresAt: -1 });
    res.json(sub || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /subscriptions/create-order  — create razorpay order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    if (!plan.isActive) return res.status(400).json({ error: 'Plan is not available' });

    // Trial plan — activate directly without payment
    if (plan.isTrial || plan.price === 0) {
      const start   = new Date();
      const expires = new Date(start.getTime() + (plan.trialDays || plan.durationDays) * 86400000);
      // Expire any old active
      await Subscription.updateMany({ organizationId: req.orgId, status: 'active' }, { status: 'expired' });
      const sub = await Subscription.create({
        organizationId: req.orgId, planId: plan._id,
        status: 'active', startDate: start, expiresAt: expires,
        isTrial: true, amount: 0,
      });
      return res.json({ trial: true, subscription: sub });
    }

    const { instance, keyId } = await getRazorpayInstance();
    const order = await instance.orders.create({
      amount:   plan.price,   // already in paise
      currency: 'INR',
      receipt:  `rcpt_${req.orgId}_${Date.now()}`,
    });

    // Save pending subscription
    await Subscription.create({
      organizationId: req.orgId, planId: plan._id,
      razorpayOrderId: order.id, status: 'pending', amount: plan.price,
    });

    res.json({ orderId: order.id, amount: plan.price, currency: 'INR', keyId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /subscriptions/verify  — verify razorpay payment signature
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const cfg = await RazorpayConfig.findOne();
    const keySecret = cfg?.mode === 'live' ? cfg.liveKeySecret : cfg.testKeySecret;

    const expectedSig = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature)
      return res.status(400).json({ error: 'Invalid payment signature' });

    const sub = await Subscription.findOne({ razorpayOrderId: razorpay_order_id })
      .populate('planId');
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });

    const start   = new Date();
    const expires = new Date(start.getTime() + sub.planId.durationDays * 86400000);

    // Expire old active subs
    await Subscription.updateMany(
      { organizationId: sub.organizationId, status: 'active' },
      { status: 'expired' }
    );

    sub.razorpayPaymentId = razorpay_payment_id;
    sub.status    = 'active';
    sub.startDate = start;
    sub.expiresAt = expires;
    await sub.save();

    res.json({ success: true, expiresAt: expires });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
