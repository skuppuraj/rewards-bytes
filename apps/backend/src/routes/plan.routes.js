const router = require('express').Router();
const Plan = require('../models/Plan');

// Public: list active plans (for org dashboard buy plan page)
router.get('/', async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });
    res.json(plans);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
