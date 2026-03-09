const Coupon = require('../models/Coupon');
const { nanoid } = require('nanoid');

exports.generateCoupon = async ({ organization_id, customer_id, offer_id, game_session_id, offer }) => {
  const couponCode = offer.auto_generate_coupon
    ? `RB-${nanoid(8).toUpperCase()}`
    : null;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + (offer.validity_days || 30));

  const coupon = await Coupon.create({
    organization_id,
    customer_id,
    offer_id,
    game_session_id,
    coupon_code: couponCode,
    status: 'active',
    start_date: startDate,
    end_date: endDate,
    validity_days: offer.validity_days || 30,
  });

  return coupon;
};
