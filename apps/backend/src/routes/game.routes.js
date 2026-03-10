const router   = require('express').Router();
const auth     = require('../middleware/auth.middleware');
const Game     = require('../models/Game');
const OrgGame  = require('../models/OrgGame');
const Offer    = require('../models/Offer');

// GET /games  — org’s own configured games
router.get('/', auth, async (req, res) => {
  try {
    const systemGames = await Game.find().lean();
    const orgGames    = await OrgGame.find({ organizationId: req.orgId }).populate('assignedOffers').lean();
    const orgMap = {};
    orgGames.forEach(og => { orgMap[String(og.gameId)] = og; });
    const result = systemGames.map(g => ({
      ...g,
      orgConfig: orgMap[String(g._id)] ? {
        ...orgMap[String(g._id)],
        assignedOffers: orgMap[String(g._id)].assignedOffers || [],
      } : null,
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /games/marketplace  — all games with filters + pagination
router.get('/marketplace', auth, async (req, res) => {
  try {
    const { search = '', category = '', orgType = '', newLaunch = '', page = 1, limit = 9 } = req.query;
    const query = {};
    if (search)    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { shortDescription: { $regex: search, $options: 'i' } },
    ];
    if (category)  query.category  = category;
    if (orgType)   query.orgTypes   = orgType;
    if (newLaunch === 'true') query.isNewLaunch = true;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Game.countDocuments(query);
    const games = await Game.find(query).sort({ isNewLaunch: -1, createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean();

    // Attach org config to each game
    const orgGames = await OrgGame.find({ organizationId: req.orgId, gameId: { $in: games.map(g => g._id) } }).lean();
    const orgMap   = Object.fromEntries(orgGames.map(og => [String(og.gameId), og]));
    const result   = games.map(g => ({ ...g, orgConfig: orgMap[String(g._id)] || null }));

    res.json({ games: result, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /games/:id/configure
router.post('/:id/configure', auth, async (req, res) => {
  try {
    const { isEnabled, assignedOffers, timerMinutes, gameConfig } = req.body;
    const orgGame = await OrgGame.findOneAndUpdate(
      { organizationId: req.orgId, gameId: req.params.id },
      { isEnabled, assignedOffers, timerMinutes, gameConfig },
      { upsert: true, new: true }
    ).populate('assignedOffers');
    res.json(orgGame);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
