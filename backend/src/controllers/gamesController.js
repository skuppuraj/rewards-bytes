const Game = require('../models/Game');
const OrganizationGame = require('../models/OrganizationGame');

exports.getGames = async (req, res) => {
  try {
    const allGames = await Game.find({ is_published: true });
    const orgGames = await OrganizationGame.find({ organization_id: req.user.organization_id }).populate('assigned_offers');
    const orgGameMap = {};
    orgGames.forEach(og => { orgGameMap[og.game_id.toString()] = og; });

    const result = allGames.map(game => ({
      game,
      org_game: orgGameMap[game._id.toString()] || null,
    }));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ success: false, message: 'Game not found' });
    res.json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.configureGame = async (req, res) => {
  const { gameId } = req.params;
  const { assigned_offers, timer_minutes } = req.body;
  try {
    const config = await OrganizationGame.findOneAndUpdate(
      { organization_id: req.user.organization_id, game_id: gameId },
      { assigned_offers, timer_minutes, setup_completed: true },
      { new: true, upsert: true }
    ).populate('assigned_offers');
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleGame = async (req, res) => {
  const { gameId } = req.params;
  try {
    const orgGame = await OrganizationGame.findOne({ organization_id: req.user.organization_id, game_id: gameId });
    if (!orgGame) return res.status(400).json({ success: false, message: 'Please configure the game first' });
    if (!orgGame.setup_completed) return res.status(400).json({ success: false, message: 'Complete game setup before enabling' });
    orgGame.is_enabled = !orgGame.is_enabled;
    await orgGame.save();
    res.json({ success: true, data: orgGame });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
