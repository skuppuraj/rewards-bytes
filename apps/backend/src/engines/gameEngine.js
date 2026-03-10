const GameSession = require('../models/GameSession');
const OrgGame = require('../models/OrgGame');
const Customer = require('../models/Customer');
const FraudLog = require('../models/FraudLog');
const OrgSettings = require('../models/OrgSettings');
const { generateReward } = require('./rewardEngine');

exports.startSession = async ({ organizationId, customerId, orgGameId, ipAddress, deviceAgent }) => {
  const orgGame = await OrgGame.findOne({ _id: orgGameId, organizationId, isEnabled: true });
  if (!orgGame) throw new Error('Game not available');

  const settings = await OrgSettings.findOne({ organizationId });
  const today    = new Date().toISOString().split('T')[0];
  const customer = await Customer.findById(customerId);

  // ── One Play Per Game (lifetime) ──────────────────────────────────────────
  if (settings?.onePlayPerGame) {
    const played = await GameSession.findOne({
      organizationId,
      customerId,
      gameId: orgGame.gameId,
      status: { $in: ['completed', 'active'] }
    });
    if (played) throw new Error('You can only play each game once. Check your rewards!');
  }

  // ── One Play Per Day Per Phone ─────────────────────────────────────────────
  if (settings?.onePlayPerDayPerPhone) {
    const exists = await FraudLog.findOne({
      organizationId,
      phone: customer.phone,
      playDate: today,
      gameId: orgGame.gameId
    });
    if (exists) throw new Error('You have already played this game today. Come back tomorrow!');
  }

  // ── One Play Per IP ───────────────────────────────────────────────────────
  if (settings?.onePlayPerIp && ipAddress) {
    const ipExists = await FraudLog.findOne({
      organizationId,
      ipAddress,
      playDate: today,
      gameId: orgGame.gameId
    });
    if (ipExists) throw new Error('This device has already played today.');
  }

  const session = await GameSession.create({
    organizationId,
    customerId,
    orgGameId,
    gameId: orgGame.gameId,
    ipAddress,
    deviceAgent,
    status: 'active'
  });

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

exports.completeSession = async ({ sessionId, result, organizationId }) => {
  const session = await GameSession.findOne({ _id: sessionId, organizationId, status: 'active' });
  if (!session) throw new Error('Invalid or already completed session');

  session.endedAt = new Date();
  session.status  = 'completed';
  session.result  = result;
  await session.save();

  const { offer, coupon } = await generateReward({
    organizationId,
    customerId:    session.customerId,
    orgGameId:     session.orgGameId,
    gameSessionId: session._id
  });

  if (offer)  session.offerId  = offer._id;
  if (coupon) session.couponId = coupon._id;
  await session.save();

  await Customer.findByIdAndUpdate(session.customerId, { $inc: { totalGamesPlayed: 1 } });

  return { session, offer, coupon };
};

exports.abandonSession = async (sessionId) => {
  await GameSession.findByIdAndUpdate(sessionId, { status: 'abandoned', endedAt: new Date() });
};
