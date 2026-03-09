const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getStaff = async (req, res) => {
  try {
    const staff = await User.find({ organization_id: req.user.organization_id, role: 'staff' }).select('-password');
    res.json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createStaff = async (req, res) => {
  const { name, email, mobile, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });
    const staff = await User.create({
      name, email, mobile,
      password,
      role: 'staff',
      organization_id: req.user.organization_id,
      is_email_verified: true,
    });
    res.status(201).json({ success: true, data: { ...staff.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    await User.findOneAndUpdate({ _id: req.params.id, organization_id: req.user.organization_id, role: 'staff' }, { is_active: false });
    res.json({ success: true, message: 'Staff deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
