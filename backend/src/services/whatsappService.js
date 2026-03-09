const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const fromNumber = process.env.TWILIO_WHATSAPP_FROM;

exports.sendOTP = async (phone, otp) => {
  await client.messages.create({
    from: fromNumber,
    to: `whatsapp:${phone}`,
    body: `🎮 Your Rewards Bytes verification code is: *${otp}*\nValid for 10 minutes. Do not share this with anyone.`,
  });
};

exports.sendCouponWhatsApp = async (phone, offerName, couponCode, endDate) => {
  const validUntil = endDate ? new Date(endDate).toLocaleDateString() : 'N/A';
  await client.messages.create({
    from: fromNumber,
    to: `whatsapp:${phone}`,
    body: `🎉 Congratulations! You won a reward from Rewards Bytes!\n\n*Offer:* ${offerName}\n*Coupon Code:* ${couponCode || 'No code required'}\n*Valid Until:* ${validUntil}\n\nShow this message to redeem your offer. 🎁`,
  });
};
