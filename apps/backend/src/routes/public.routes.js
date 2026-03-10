const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const OrgGame = require('../models/OrgGame');
const Game = require('../models/Game');
const Coupon = require('../models/Coupon');
const GameSession = require('../models/GameSession');
const Organization = require('../models/Organization');
const OrgSettings = require('../models/OrgSettings');
const { generateAndSendOtp, verifyOtp } = require('../utils/otp');
const { startSession, completeSession, abandonSession } = require('../engines/gameEngine');

// Get org public info + settings by slug
router.get('/org/:slug', async (req, res) => {
  try {
    const org = await Organization.findOne({ slug: req.params.slug });
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    const settings = await OrgSettings.findOne({ organizationId: org._id });
    res.json({ org: { id: org._id, name: org.name }, settings });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get enabled games for org
router.get('/games/:orgId', async (req, res) => {
  try {
    const orgGames = await OrgGame.find({ organizationId: req.params.orgId, isEnabled: true })
      .populate('gameId')
      .populate('assignedOffers', 'name shortDescription discountType discountValue imageUrl');
    res.json(orgGames);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Send OTP
router.post('/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    await generateAndSendOtp(phone);
    res.json({ message: 'OTP sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Verify OTP
router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, otp, name, orgId, marketingConsent } = req.body;
    const result = await verifyOtp(phone, otp);
    if (!result.valid) return res.status(400).json({ error: result.reason });
    let customer = await Customer.findOne({ organizationId: orgId, phone });
    if (!customer) {
      customer = await Customer.create({ organizationId: orgId, name: name || phone, phone, isVerified: true, marketingConsent: marketingConsent || false });
    } else {
      customer.isVerified = true;
      if (name) customer.name = name;
      await customer.save();
    }
    const token = jwt.sign({ customerId: customer._id, orgId }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, customer });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Customer auth middleware
const customerAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.customerId = decoded.customerId;
    req.orgId = decoded.orgId;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

// GET session by ID (used by game pages to read config)
router.get('/game/session/:sessionId', customerAuth, async (req, res) => {
  try {
    const session = await GameSession.findOne({ _id: req.params.sessionId, customerId: req.customerId })
      .populate({
        path: 'orgGameId',
        populate: { path: 'gameId assignedOffers', select: 'name key rules shortDescription name discountType discountValue' }
      });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Start game session
router.post('/game/start', customerAuth, async (req, res) => {
  try {
    const { orgGameId } = req.body;
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const deviceAgent = req.headers['user-agent'];
    const session = await startSession({ organizationId: req.orgId, customerId: req.customerId, orgGameId, ipAddress, deviceAgent });
    res.json(session);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Complete game session
router.post('/game/complete', customerAuth, async (req, res) => {
  try {
    const { sessionId, result } = req.body;
    const data = await completeSession({ sessionId, result, organizationId: req.orgId });
    res.json(data);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Abandon session
router.post('/game/abandon', customerAuth, async (req, res) => {
  try {
    await abandonSession(req.body.sessionId);
    res.json({ message: 'Session abandoned' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Submit feedback
router.post('/feedback', customerAuth, async (req, res) => {
  try {
    const { sessionId, gameRating, offerRating, enjoymentRating, comment } = req.body;
    await GameSession.findOneAndUpdate(
      { _id: sessionId, customerId: req.customerId },
      { feedback: { gameRating, offerRating, enjoymentRating, comment, submittedAt: new Date() } }
    );
    res.json({ message: 'Feedback submitted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get customer's game history
router.get('/my/games', customerAuth, async (req, res) => {
  try {
    const sessions = await GameSession.find({ customerId: req.customerId, status: 'completed' })
      .populate('gameId', 'name key imageUrl')
      .populate('offerId', 'name shortDescription discountType discountValue')
      .populate('couponId', 'code status expiresAt')
      .sort({ startedAt: -1 });
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get customer's offers
router.get('/my/offers', customerAuth, async (req, res) => {
  try {
    await Coupon.updateMany({ customerId: req.customerId, status: 'active', expiresAt: { $lt: new Date() } }, { status: 'expired' });
    const coupons = await Coupon.find({ customerId: req.customerId })
      .populate('offerId', 'name shortDescription imageUrl discountType discountValue')
      .sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
