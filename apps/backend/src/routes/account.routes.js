const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const auth    = require('../middleware/auth.middleware');
const User    = require('../models/User');
const Organization = require('../models/Organization');

// PATCH /account/password
router.patch('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Both current and new passwords are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user.userId);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /account/org-name
router.patch('/org-name', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const org = await Organization.findByIdAndUpdate(req.orgId, { name: name.trim() }, { new: true });
    res.json({ name: org.name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
