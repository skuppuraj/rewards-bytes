const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const Offer = require('../models/Offer');
const OrgGame = require('../models/OrgGame');
const { upload, processImage } = require('../middleware/upload.middleware');

router.get('/', auth, async (req, res) => {
  try {
    const offers = await Offer.find({ organizationId: req.orgId }).sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { name, shortDescription, description, validityDays, discountType, discountValue, autoGenerateCoupon, startDate } = req.body;
    let imageUrl;
    if (req.file) {
      const filename = `offer-${Date.now()}.jpg`;
      imageUrl = await processImage(req.file.buffer, filename, 600);
    }
    const offer = await Offer.create({
      organizationId: req.orgId, name, shortDescription, description,
      validityDays: parseInt(validityDays), discountType, discountValue: parseFloat(discountValue),
      autoGenerateCoupon: autoGenerateCoupon === 'true', startDate, imageUrl
    });
    res.status(201).json(offer);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.patch('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const update = { ...req.body, updatedAt: new Date() };
    if (req.file) {
      const filename = `offer-${Date.now()}.jpg`;
      update.imageUrl = await processImage(req.file.buffer, filename, 600);
    }
    const offer = await Offer.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.orgId },
      update, { new: true }
    );
    if (!offer) return res.status(404).json({ error: 'Offer not found' });
    res.json(offer);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Get games using this offer (before delete)
router.get('/:id/games', auth, async (req, res) => {
  try {
    const orgGames = await OrgGame.find({
      organizationId: req.orgId,
      assignedOffers: req.params.id
    }).populate('gameId', 'name key');
    res.json(orgGames);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    // Remove from all org games
    await OrgGame.updateMany(
      { organizationId: req.orgId, assignedOffers: req.params.id },
      { $pull: { assignedOffers: req.params.id } }
    );
    // Disable org games with no offers left
    const emptyGames = await OrgGame.find({ organizationId: req.orgId, assignedOffers: { $size: 0 } });
    for (const g of emptyGames) { g.isEnabled = false; await g.save(); }
    await Offer.findOneAndDelete({ _id: req.params.id, organizationId: req.orgId });
    res.json({ message: 'Offer deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
