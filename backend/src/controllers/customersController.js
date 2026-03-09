const Customer = require('../models/Customer');
const GameSession = require('../models/GameSession');
const Coupon = require('../models/Coupon');

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ organization_id: req.user.organization_id }).sort({ createdAt: -1 });
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, organization_id: req.user.organization_id });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCustomerHistory = async (req, res) => {
  try {
    const [sessions, coupons] = await Promise.all([
      GameSession.find({ customer_id: req.params.id, organization_id: req.user.organization_id }).populate('game_id').sort({ createdAt: -1 }),
      Coupon.find({ customer_id: req.params.id, organization_id: req.user.organization_id }).populate('offer_id').sort({ createdAt: -1 }),
    ]);
    res.json({ success: true, data: { sessions, coupons } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
