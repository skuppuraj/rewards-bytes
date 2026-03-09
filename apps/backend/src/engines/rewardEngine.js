const OrgGame = require('../models/OrgGame');
const Offer = require('../models/Offer');
const Customer = require('../models/Customer');
const Organization = require('../models/Organization');
const { createCoupon } = require('./couponEngine');
const { sendCouponReward } = require('../utils/whatsapp');

// Randomly select an offer from org game's assigned offers
const selectOffer = (offers) => {
  if (!offers || offers.length === 0) return null;
  const idx = Math.floor(Math.random() * offers.length);
  return offers[idx];
};

// Main reward generation after game completes
exports.generateReward = async ({ organizationId, customerId, orgGameId, gameSessionId }) => {
  // Load org game with offers
  const orgGame = await OrgGame.findById(orgGameId).populate('assignedOffers');
  if (!orgGame || !orgGame.assignedOffers.length) {
    return { offer: null, coupon: null };
  }

  // Select a random offer
  const offer = selectOffer(orgGame.assignedOffers);
  if (!offer || !offer.isActive) return { offer: null, coupon: null };

  // Generate coupon
  let coupon = null;
  if (offer.autoGenerateCoupon) {
    coupon = await createCoupon({
      organizationId,
      customerId,
      offerId: offer._id,
      gameSessionId,
      validityDays: offer.validityDays
    });
  }

  // Update customer stats
  await Customer.findByIdAndUpdate(customerId, {
    $inc: { totalOffersObtained: 1 }
  });

  // Send WhatsApp coupon
  if (coupon) {
    const customer = await Customer.findById(customerId);
    const org = await Organization.findById(organizationId);
    const discountText = offer.discountType === 'percentage'
      ? `${offer.discountValue}% off`
      : `₹${offer.discountValue} off`;

    const waSent = await sendCouponReward(customer.phone, {
      orgName: org.name,
      offerName: offer.name,
      couponCode: coupon.code,
      discount: discountText,
      expiresAt: coupon.expiresAt
    });

    if (waSent) {
      coupon.whatsappSent = true;
      coupon.whatsappSentAt = new Date();
      await coupon.save();
    }
  }

  return { offer, coupon };
};
