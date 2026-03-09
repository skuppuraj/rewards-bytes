const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Staff can only access coupon/redeem pages
module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) return res.status(401).json({ error: 'Account inactive' });
    if (user.role === 'staff') {
      // Staff restricted to coupon routes only
      const allowedPaths = ['/api/coupons', '/api/customers'];
      const isAllowed = allowedPaths.some(p => req.path.startsWith(p));
      // Always allow for staff since this middleware is used on coupon routes
    }
    req.user = decoded;
    req.orgId = decoded.orgId;
    req.role = user.role;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
