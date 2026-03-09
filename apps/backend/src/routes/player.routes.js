const router = require('express').Router();
const auth = require('../middleware/tenant.middleware');
const Player = require('../models/Player');

router.get('/', auth, async (req, res) => {
  try {
    const players = await Player.find({ organizationId: req.orgId }).sort({ totalPoints: -1 });
    res.json(players);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const player = await Player.findOne({ _id: req.params.id, organizationId: req.orgId });
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const player = await Player.create({ organizationId: req.orgId, name, email, phone });
    res.status(201).json(player);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const player = await Player.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.orgId },
      req.body, { new: true }
    );
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Player.findOneAndDelete({ _id: req.params.id, organizationId: req.orgId });
    res.json({ message: 'Player deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/award-points', auth, async (req, res) => {
  try {
    const { points } = req.body;
    const player = await Player.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.orgId },
      { $inc: { totalPoints: points } }, { new: true }
    );
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json({ message: `${points} points awarded`, player });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
