const router = require('express').Router();
const auth = require('../middleware/tenant.middleware');
const Game = require('../models/Game');
const Player = require('../models/Player');

router.get('/', auth, async (req, res) => {
  try {
    const games = await Game.find({ organizationId: req.orgId });
    res.json(games);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, type, config, pointsPerPlay } = req.body;
    const game = await Game.create({ organizationId: req.orgId, name, type, config, pointsPerPlay });
    res.status(201).json(game);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const game = await Game.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.orgId },
      req.body, { new: true }
    );
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await Game.findOneAndDelete({ _id: req.params.id, organizationId: req.orgId });
    res.json({ message: 'Game deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/play', async (req, res) => {
  try {
    const { playerId } = req.body;
    const game = await Game.findOne({ _id: req.params.id, isActive: true });
    if (!game) return res.status(404).json({ error: 'Game not found or inactive' });
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    let pointsEarned = game.pointsPerPlay;
    let result = {};

    switch (game.type) {
      case 'spin_wheel': {
        const segments = game.config?.segments || [];
        const randomIndex = Math.floor(Math.random() * segments.length);
        const segment = segments[randomIndex];
        pointsEarned = segment?.points || game.pointsPerPlay;
        result = { segment: segment?.label || 'Unknown', pointsEarned };
        break;
      }
      case 'scratch_card': {
        const prizes = game.config?.prizes || [];
        const prize = prizes[Math.floor(Math.random() * prizes.length)];
        pointsEarned = prize?.points || game.pointsPerPlay;
        result = { prize: prize?.label || 'Try Again', pointsEarned };
        break;
      }
      default:
        result = { pointsEarned };
    }

    const updatedPlayer = await Player.findByIdAndUpdate(
      playerId,
      {
        $inc: { totalPoints: pointsEarned },
        $set: { level: Math.floor((player.totalPoints + pointsEarned) / 100) + 1 }
      },
      { new: true }
    );

    res.json({ result, player: updatedPlayer });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
