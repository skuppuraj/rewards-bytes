const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const Game = require('../models/Game');
const OrgGame = require('../models/OrgGame');

// Get all system games + org config
router.get('/', auth, async (req, res) => {
  try {
    const games = await Game.find();
    const orgGames = await OrgGame.find({ organizationId: req.orgId })
      .populate('assignedOffers', 'name discountType discountValue');
    const result = games.map(g => {
      const orgGame = orgGames.find(og => og.gameId.toString() === g._id.toString());
      return { ...g.toObject(), orgConfig: orgGame || null };
    });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Configure game (enable/disable, offers, gameConfig)
router.post('/:gameId/configure', auth, async (req, res) => {
  try {
    const { isEnabled, assignedOffers, timerMinutes, gameConfig } = req.body;

    let orgGame = await OrgGame.findOne({ organizationId: req.orgId, gameId: req.params.gameId });
    if (!orgGame) {
      orgGame = new OrgGame({ organizationId: req.orgId, gameId: req.params.gameId });
    }

    if (isEnabled      !== undefined) orgGame.isEnabled      = isEnabled;
    if (assignedOffers !== undefined) orgGame.assignedOffers = assignedOffers;
    if (timerMinutes   !== undefined) orgGame.timerMinutes   = parseInt(timerMinutes);
    if (gameConfig     !== undefined) {
      // Use $set-style merge so Mixed field triggers change detection
      orgGame.gameConfig = { ...(orgGame.gameConfig || {}), ...gameConfig };
      orgGame.markModified('gameConfig');
    }

    orgGame.updatedAt = new Date();
    await orgGame.save();
    res.json(orgGame);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Seed system games (run once)
router.post('/seed', async (req, res) => {
  try {
    const games = [
      { key: 'spin_wheel',    name: 'Spin Wheel',    shortDescription: 'Spin the wheel and win amazing rewards!',   fullDescription: 'A classic spin-the-wheel game where customers spin a colorful wheel to land on prize segments.', rules: ['Click SPIN to start', 'Wait for the wheel to stop', 'Your reward will be revealed automatically', 'One spin per day allowed'], imageUrl: null, videoDemoUrl: null },
      { key: 'scratch_card',  name: 'Scratch Card',  shortDescription: 'Scratch and reveal your hidden prize!',     fullDescription: 'Customers scratch a virtual card to reveal their hidden prize.', rules: ['Tap the card to start scratching', 'Scratch the entire surface to reveal prize', 'Prize is automatically credited to your account'], imageUrl: null, videoDemoUrl: null },
      { key: 'catch_popcorn', name: 'Catch Popcorn', shortDescription: 'Catch falling popcorn to win rewards!',     fullDescription: 'Customers move a bucket to catch falling popcorn. Catch enough to win an offer!', rules: ['Move the bucket left and right', 'Catch falling popcorn pieces', 'Reach the target count before time runs out'], imageUrl: null, videoDemoUrl: null },
    ];
    for (const g of games) {
      await Game.findOneAndUpdate({ key: g.key }, g, { upsert: true, new: true });
    }
    res.json({ message: 'Games seeded' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
