const FraudLog = require('../models/FraudLog');
const OrgSettings = require('../models/OrgSettings');

exports.checkFraud = async ({ organizationId, phone, ipAddress, gameId }) => {
  const settings = await OrgSettings.findOne({ organizationId });
  const today = new Date().toISOString().split('T')[0];
  const violations = [];

  if (settings?.onePlayPerDayPerPhone && phone) {
    const exists = await FraudLog.findOne({ organizationId, phone, playDate: today, gameId });
    if (exists) violations.push('phone_limit');
  }

  if (settings?.onePlayPerIp && ipAddress) {
    const ipExists = await FraudLog.findOne({ organizationId, ipAddress, playDate: today, gameId });
    if (ipExists) violations.push('ip_limit');
  }

  return {
    blocked: violations.length > 0,
    violations
  };
};
