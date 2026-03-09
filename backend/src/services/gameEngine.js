const GameSession = require('../models/GameSession');
const Customer = require('../models/Customer');
const PlayThrottle = require('../models/PlayThrottle');
const Organization = require('../models/Organization');
const OrganizationGame = require('../models/OrganizationGame');

exports.checkPlayEligibility = async ({ organization_id, game_id, phone, ip_address }) => {
  const org = await Organization.findById(organization_id);
  const today = new Date().toISOString().split('T')[0];

  if (org.settings.one_play_per_day) {
    const phoneThrottle = await PlayThrottle.findOne({ organization_id, game_id, phone, played_date: today });
    if (phoneThrottle) return { eligible: false, reason: 'You have already played this game today. Come back tomorrow!' };
  }

  if (org.settings.one_play_per_ip) {
    const ipThrottle = await PlayThrottle.findOne({ organization_id, game_id, ip_address, played_date: today });
    if (ipThrottle) return { eligible: false, reason: 'This device has already been used to play today.' };
  }

  return { eligible: true };
};

exports.startGameSession = async ({ organization_id, customer_id, game_id, org_game_id, ip_address, user_agent }) => {
  const today = new Date().toISOString().split('T')[0];
  const customer = await Customer.findById(customer_id);

  // Record play throttle
  await PlayThrottle.create({ organization_id, game_id, phone: customer.phone, ip_address, played_date: today });

  const session = await GameSession.create({
    organization_id, customer_id, game_id, org_game_id,
    status: 'started', started_at: new Date(), ip_address, user_agent,
  });

  return session;
};

exports.finishGameSession = async (sessionId, game_result) => {
  const session = await GameSession.findByIdAndUpdate(
    sessionId,
    { status: 'completed', ended_at: new Date(), game_result, reward_given: false },
    { new: true }
  );
  return session;
};
