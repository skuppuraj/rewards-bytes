const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const OrgSettings = require('../models/OrgSettings');
const Organization = require('../models/Organization');
const { upload, processImage } = require('../middleware/upload.middleware');

router.get('/', auth, async (req, res) => {
  try {
    const settings = await OrgSettings.findOne({ organizationId: req.orgId });
    res.json(settings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/', auth, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'backgroundImage', maxCount: 1 }]), async (req, res) => {
  try {
    const update = { ...req.body, updatedAt: new Date() };
    // Parse socialMedia if sent as JSON string
    if (req.body.socialMedia && typeof req.body.socialMedia === 'string') {
      update.socialMedia = JSON.parse(req.body.socialMedia);
    }
    // Handle boolean fields
    ['whatsappOtpEnabled', 'marketingConsentEnabled', 'onePlayPerDayPerPhone', 'onePlayPerIp', 'feedbackEnabled'].forEach(f => {
      if (update[f] !== undefined) update[f] = update[f] === 'true' || update[f] === true;
    });
    if (req.files?.logo?.[0]) {
      update.logoUrl = await processImage(req.files.logo[0].buffer, `logo-${req.orgId}.jpg`, 400);
    }
    if (req.files?.backgroundImage?.[0]) {
      update.backgroundImageUrl = await processImage(req.files.backgroundImage[0].buffer, `bg-${req.orgId}.jpg`, 1920);
    }
    // Also update org name if provided
    if (update.orgName) {
      await Organization.findByIdAndUpdate(req.orgId, { name: update.orgName });
      delete update.orgName;
    }
    const settings = await OrgSettings.findOneAndUpdate(
      { organizationId: req.orgId },
      update,
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
