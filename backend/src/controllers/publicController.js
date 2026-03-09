const Organization = require('../models/Organization');
const OrganizationGame = require('../models/OrganizationGame');
const Customer = require('../models/Customer');
const GameSession = require('../models/GameSession');
const Coupon = require('../models/Coupon');
const { checkPlayEligibility, startGameSession, finishGameSession } = require('../services/gameEngine');
const { giveReward } = require('../services/rewardEngine');
const { sendOTP } = require('../services/whatsappService');

const otpStore = new Map(); // In production, use Redis

exports.getOrgBySlug = async (req, res) => {
  try {
    const org = await Organization.findOne({ slug: req.params.slug, is_active: true }).select('-owner_id');
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    res.json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrgGames = async (req, res) => {
  try {
    const org = await Organization.findOne({ slug: req.params.slug });
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });
    const games = await OrganizationGame.find({ organization_id: org._id, is_enabled: true }).populate('game_id assigned_offers');
    res.json({ success: true, data: games });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.requestWhatsAppOTP = async (req, res) => {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(`${req.params.slug}:${phone}`, { otp, expires: Date.now() + 10 * 60 * 1000 });
  try {
    await sendOTP(phone, otp);
    res.json({ success: true, message: 'OTP sent to WhatsApp' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

exports.verifyWhatsAppOTP = async (req, res) => {
  const { phone, otp, name } = req.body;
  const key = `${req.params.slug}:${phone}`;
  const stored = otpStore.get(key);
  if (!stored || stored.otp !== otp || stored.expires < Date.now()) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }
  otpStore.delete(key);
  const org = await Organization.findOne({ slug: req.params.slug });
  let customer = await Customer.findOne({ organization_id: org._id, phone });
  if (!customer) {
    customer = await Customer.create({ organization_id: org._id, phone, name: name || 'Guest', whatsapp_verified: true });
  }
  res.json({ success: true, customer });
};

exports.startGame = async (req, res) => {
  const { customer_id, org_game_id } = req.body;
  const ip = req.ip;
  try {
    const org = await Organization.findOne({ slug: req.params.slug });
    const orgGame = await OrganizationGame.findById(org_game_id);
    const eligibility = await checkPlayEligibility({ organization_id: org._id, game_id: orgGame.game_id, phone: (await Customer.findById(customer_id)).phone, ip_address: ip });
    if (!eligibility.eligible) return res.status(429).json({ success: false, message: eligibility.reason });
    const session = await startGameSession({ organization_id: org._id, customer_id, game_id: orgGame.game_id, org_game_id, ip_address: ip, user_agent: req.headers['user-agent'] });
    await Customer.findByIdAndUpdate(customer_id, { $inc: { total_games_played: 1 }, last_played_at: new Date(), last_ip: ip });
    res.json({ success: true, session, timer_minutes: orgGame.timer_minutes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.finishGame = async (req, res) => {
  const { session_id, game_result } = req.body;
  try {
    const org = await Organization.findOne({ slug: req.params.slug });
    const session = await finishGameSession(session_id, game_result);
    const orgGame = await OrganizationGame.findById(session.org_game_id);
    const reward = await giveReward({ organization_id: org._id, customer_id: session.customer_id, game_session_id: session._id, assigned_offers: orgGame.assigned_offers });
    if (reward) {
      session.coupon_id = reward.coupon._id;
      session.reward_given = true;
      await session.save();
    }
    res.json({ success: true, session, reward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitFeedback = async (req, res) => {
  const { session_id, game_rating, offer_rating, enjoyment_rating, comment } = req.body;
  try {
    await GameSession.findByIdAndUpdate(session_id, { feedback: { game_rating, offer_rating, enjoyment_rating, comment, submitted_at: new Date() } });
    res.json({ success: true, message: 'Feedback submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomerGames = async (req, res) => {
  const { customer_id } = req.query;
  try {
    const sessions = await GameSession.find({ customer_id }).populate('game_id').sort({ createdAt: -1 });
    res.json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomerOffers = async (req, res) => {
  const { customer_id } = req.query;
  try {
    const coupons = await Coupon.find({ customer_id }).populate('offer_id').sort({ createdAt: -1 });
    const now = new Date();
    const result = coupons.map(c => ({
      ...c.toObject(),
      status: c.status === 'active' && c.end_date < now ? 'expired' : c.status,
    }));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
