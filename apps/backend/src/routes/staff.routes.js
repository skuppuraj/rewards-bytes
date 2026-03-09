const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// List staff
router.get('/', auth, async (req, res) => {
  try {
    const staff = await User.find({ organizationId: req.orgId, role: 'staff' }).select('-password');
    res.json(staff);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create staff account
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, password, permissions } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const staff = await User.create({
      organizationId: req.orgId,
      name, email,
      password: hashed,
      role: 'staff',
      permissions: permissions || { canRedeemCoupons: true, canViewCustomers: true }
    });
    const { password: _, ...staffData } = staff.toObject();
    res.status(201).json(staffData);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Update staff
router.patch('/:id', auth, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.password) {
      update.password = await bcrypt.hash(update.password, 10);
    }
    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.orgId, role: 'staff' },
      update, { new: true }
    ).select('-password');
    if (!staff) return res.status(404).json({ error: 'Staff not found' });
    res.json(staff);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Delete staff
router.delete('/:id', auth, async (req, res) => {
  try {
    await User.findOneAndDelete({ _id: req.params.id, organizationId: req.orgId, role: 'staff' });
    res.json({ message: 'Staff deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
