const Offer = require('../models/Offer');
const OrganizationGame = require('../models/OrganizationGame');
const Game = require('../models/Game');

exports.getOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ organization_id: req.user.organization_id }).sort({ createdAt: -1 });
    res.json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createOffer = async (req, res) => {
  try {
    const offerData = { ...req.body, organization_id: req.user.organization_id };
    if (req.file) offerData.image = `/uploads/${req.file.filename}`;
    const offer = await Offer.create(offerData);
    res.status(201).json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOffer = async (req, res) => {
  try {
    const offer = await Offer.findOne({ _id: req.params.id, organization_id: req.user.organization_id });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    if (req.file) req.body.image = `/uploads/${req.file.filename}`;
    Object.assign(offer, req.body);
    await offer.save();
    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findOne({ _id: req.params.id, organization_id: req.user.organization_id });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });

    // Find assigned games
    const assignedGames = await OrganizationGame.find({
      organization_id: req.user.organization_id,
      assigned_offers: req.params.id,
    }).populate('game_id', 'name');

    // Remove offer from all assigned games and disable them
    await OrganizationGame.updateMany(
      { organization_id: req.user.organization_id, assigned_offers: req.params.id },
      { $pull: { assigned_offers: req.params.id }, $set: { is_enabled: false } }
    );

    offer.is_active = false;
    await offer.save();

    res.json({ success: true, message: 'Offer deleted', affected_games: assignedGames.map(g => g.game_id?.name) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
