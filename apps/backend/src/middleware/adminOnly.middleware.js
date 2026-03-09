// Only owner/admin can access — blocks staff
module.exports = (req, res, next) => {
  if (req.role === 'staff') {
    return res.status(403).json({ error: 'Access denied. Staff cannot perform this action.' });
  }
  next();
};
