const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const Customer = require('../models/Customer');

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const query = { organizationId: req.orgId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    const [customers, total] = await Promise.all([
      Customer.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Customer.countDocuments(query)
    ]);
    res.json({ customers, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, organizationId: req.orgId });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
