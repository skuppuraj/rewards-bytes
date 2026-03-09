const GameSession = require('../models/GameSession');
const OrgGame = require('../models/OrgGame');
const Customer = require('../models/Customer');
const FraudLog = require('../models/FraudLog');
const OrgSettings = require('../models/OrgSettings');
const { generateReward } = require('./rewardEngine');

// Start a game session
exports.startSession = async ({ organizationId, customerId, orgGameId, ipAddress, deviceAgent }) => {
  const orgGame = await OrgGame.findOne({ _id: orgGameId, organizationId, isEnabled: true });
  if (!orgGame) throw new Error('Game not available');

  // Fraud checks
  const settings = await OrgSettings.findOne({ organizationId });
  const today = new Date().toISOString().split('T')[0];
  const customer = await Customer.findById(customerId);

  if (settings?.onePlayPerDayPerPhone) {
    const exists = await FraudLog.findOne({ organizationId, phone: customer.phone, playDate: today, gameId: orgGame.gameId });
    if (exists) throw new Error('You have already played this game today. Come back tomorrow!');
  }

  if (settings?.onePlayPerIp && ipAddress) {
    const ipExists = await FraudLog.findOne({ organizationId, ipAddress, playDate: today, gameId: orgGame.gameId });
    if (ipExists) throw new Error('This device has already played today.');
  }

  // Create session
  const session = await GameSession.create({
    organizationId,
    customerId,
    orgGameId,
    gameId: orgGame.gameId,
    ipAddress,
    deviceAgent,
    status: 'active'
  });

  // Log for fraud protection
  await FraudLog.create({
    organizationId,
    phone: customer.phone,
    ipAddress,
    deviceAgent,
    playDate: today,
    gameId: orgGame.gameId,
    customerId
  });

  return session;
};

// Complete a game session and generate reward
exports.completeSession = async ({ sessionId, result, organizationId }) => {
  const session = await GameSession.findOne({ _id: sessionId, organizationId, status: 'active' });
  if (!session) throw new Error('Invalid or already completed session');

  // Mark session ended
  session.endedAt = new Date();
  session.status = 'completed';
  session.result = result;
  await session.save();

  // Generate reward
  const { offer, coupon } = await generateReward({
    organizationId,
    customerId: session.customerId,
    orgGameId: session.orgGameId,
    gameSessionId: session._id
  });

  // Update session with offer/coupon refs
  if (offer) session.offerId = offer._id;
  if (coupon) session.couponId = coupon._id;
  await session.save();

  // Update customer stats
  await Customer.findByIdAndUpdate(session.customerId, {
    $inc: { totalGamesPlayed: 1 }
  });

  return { session, offer, coupon };
};

// Abandon a session
exports.abandonSession = async (sessionId) => {
  await GameSession.findByIdAndUpdate(sessionId, {
    status: 'abandoned',
    endedAt: new Date()
  });
};
