const Coupon = require('../models/Coupon');
const Customer = require('../models/Customer');
const GameSession = require('../models/GameSession');
const { sendCouponWhatsApp } = require('../services/whatsappService');

exports.getCoupons = async (req, res) => {
  const { page = 1, limit = 10, from, to, coupon_code, name, phone, status } = req.query;
  const orgId = req.user.organization_id;

  try {
    const query = { organization_id: orgId };
    if (status) query.status = status;
    if (coupon_code) query.coupon_code = { $regex: coupon_code, $options: 'i' };
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    let couponQuery = Coupon.find(query).populate('customer_id offer_id').sort({ createdAt: -1 });

    if (name || phone) {
      const customers = await Customer.find({
        organization_id: orgId,
        ...(name && { name: { $regex: name, $options: 'i' } }),
        ...(phone && { phone: { $regex: phone, $options: 'i' } }),
      }).select('_id');
      query.customer_id = { $in: customers.map(c => c._id) };
    }

    const total = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query).populate('customer_id offer_id').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));

    // Update expired status
    const now = new Date();
    coupons.forEach(c => {
      if (c.status === 'active' && c.end_date && c.end_date < now) c.status = 'expired';
    });

    res.json({ success: true, data: coupons, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateValidity = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, organization_id: req.user.organization_id });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    const { additional_days } = req.body;
    coupon.end_date = new Date(coupon.end_date.getTime() + additional_days * 24 * 60 * 60 * 1000);
    coupon.validity_days += additional_days;
    if (coupon.status === 'expired') coupon.status = 'active';
    await coupon.save();
    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndUpdate(
      { _id: req.params.id, organization_id: req.user.organization_id },
      { status: 'deleted' }, { new: true }
    );
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.redeemCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, organization_id: req.user.organization_id }).populate('customer_id offer_id');
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    if (coupon.status !== 'active') return res.status(400).json({ success: false, message: `Coupon is ${coupon.status}` });
    coupon.status = 'redeemed';
    coupon.redeemed_at = new Date();
    coupon.redeemed_by = req.user._id;
    await coupon.save();
    res.json({ success: true, data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, organization_id: req.user.organization_id }).populate('customer_id offer_id');
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
    await sendCouponWhatsApp(coupon.customer_id.phone, coupon.offer_id.name, coupon.coupon_code, coupon.end_date);
    coupon.notification_sent = true;
    await coupon.save();
    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
