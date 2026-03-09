const axios = require('axios');

const BASE_URL = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v19.0'}`;
const PHONE_ID = process.env.META_PHONE_NUMBER_ID;
const TOKEN = process.env.META_PERMANENT_ACCESS_TOKEN;

const headers = () => ({
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json'
});

// Send OTP via WhatsApp
exports.sendOtp = async (phone, otp) => {
  const body = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: 'otp_verification',
      language: { code: 'en' },
      components: [{
        type: 'body',
        parameters: [{ type: 'text', text: otp }]
      }, {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: otp }]
      }]
    }
  };
  try {
    const res = await axios.post(`${BASE_URL}/${PHONE_ID}/messages`, body, { headers: headers() });
    return res.data;
  } catch (err) {
    console.error('WhatsApp OTP error:', err.response?.data || err.message);
    throw new Error('Failed to send OTP');
  }
};

// Send coupon reward to customer
exports.sendCouponReward = async (phone, { orgName, offerName, couponCode, discount, expiresAt }) => {
  const formattedExpiry = new Date(expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const body = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: 'coupon_reward',
      language: { code: 'en' },
      components: [{
        type: 'body',
        parameters: [
          { type: 'text', text: orgName },
          { type: 'text', text: offerName },
          { type: 'text', text: discount },
          { type: 'text', text: couponCode },
          { type: 'text', text: formattedExpiry }
        ]
      }]
    }
  };
  try {
    const res = await axios.post(`${BASE_URL}/${PHONE_ID}/messages`, body, { headers: headers() });
    return res.data;
  } catch (err) {
    console.error('WhatsApp coupon error:', err.response?.data || err.message);
    // Don't throw — coupon still generated even if WA fails
    return null;
  }
};

// Send text notification
exports.sendNotification = async (phone, message) => {
  const body = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'text',
    text: { body: message }
  };
  try {
    const res = await axios.post(`${BASE_URL}/${PHONE_ID}/messages`, body, { headers: headers() });
    return res.data;
  } catch (err) {
    console.error('WhatsApp notification error:', err.response?.data || err.message);
    return null;
  }
};
