const Offer = require('../models/Offer');
const Customer = require('../models/Customer');
const { generateCoupon } = require('./couponEngine');
const { sendCouponWhatsApp } = require('./whatsappService');

exports.giveReward = async ({ organization_id, customer_id, game_session_id, assigned_offers }) => {
  if (!assigned_offers || assigned_offers.length === 0) return null;

  // Pick a random offer from assigned offers
  const randomIndex = Math.floor(Math.random() * assigned_offers.length);
  const offerId = assigned_offers[randomIndex];

  const offer = await Offer.findById(offerId);
  if (!offer || !offer.is_active) return null;

  const coupon = await generateCoupon({ organization_id, customer_id, offer_id: offerId, game_session_id, offer });

  // Update customer stats
  await Customer.findByIdAndUpdate(customer_id, { $inc: { total_offers_obtained: 1 } });

  // Send WhatsApp notification
  const customer = await Customer.findById(customer_id).select('phone');
  try {
    await sendCouponWhatsApp(customer.phone, offer.name, coupon.coupon_code, coupon.end_date);
    coupon.notification_sent = true;
    await coupon.save();
  } catch (err) {
    console.warn('WhatsApp notification failed:', err.message);
  }

  return { coupon, offer };
};
