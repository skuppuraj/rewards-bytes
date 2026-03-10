const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.superAdmin) return res.status(403).json({ error: 'Forbidden' });
    req.superAdmin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
