const crypto = require('crypto');
const Coupon = require('../models/Coupon');

// Generate unique coupon code
const generateCode = (prefix = 'RB') => {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${rand}`;
};

// Create a coupon for a customer/offer
exports.createCoupon = async ({ organizationId, customerId, offerId, gameSessionId, validityDays }) => {
  let code;
  let exists = true;
  // Ensure unique code per org
  while (exists) {
    code = generateCode();
    exists = await Coupon.exists({ organizationId, code });
  }

  const startDate = new Date();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (validityDays || 30));

  const coupon = await Coupon.create({
    organizationId,
    customerId,
    offerId,
    gameSessionId,
    code,
    status: 'active',
    startDate,
    expiresAt
  });

  return coupon;
};

// Redeem a coupon
exports.redeemCoupon = async ({ couponId, redeemedBy }) => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) throw new Error('Coupon not found');
  if (coupon.status === 'redeemed') throw new Error('Coupon already redeemed');
  if (coupon.status === 'expired' || new Date() > coupon.expiresAt) {
    await Coupon.findByIdAndUpdate(couponId, { status: 'expired' });
    throw new Error('Coupon has expired');
  }
  coupon.status = 'redeemed';
  coupon.redeemedAt = new Date();
  coupon.redeemedBy = redeemedBy;
  await coupon.save();
  return coupon;
};

// Auto-expire coupons (can be called by a cron)
exports.expireOldCoupons = async (organizationId) => {
  const result = await Coupon.updateMany(
    { organizationId, status: 'active', expiresAt: { $lt: new Date() } },
    { status: 'expired' }
  );
  return result.modifiedCount;
};
