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
    if (req.body.socialMedia && typeof req.body.socialMedia === 'string') {
      update.socialMedia = JSON.parse(req.body.socialMedia);
    }
    ['whatsappOtpEnabled', 'marketingConsentEnabled', 'onePlayPerDayPerPhone', 'onePlayPerIp', 'feedbackEnabled'].forEach(f => {
      if (update[f] !== undefined) update[f] = update[f] === 'true' || update[f] === true;
    });
    if (req.files?.logo?.[0]) {
      update.logoUrl = await processImage(req.files.logo[0].buffer, `logo-${req.orgId}.jpg`, 400);
    }
    if (req.files?.backgroundImage?.[0]) {
      update.backgroundImageUrl = await processImage(req.files.backgroundImage[0].buffer, `bg-${req.orgId}.jpg`, 1920);
    }
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

// ── PATCH /api/org-settings/slug ── customize game page URL slug
router.patch('/slug', auth, async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ error: 'Slug is required' });

    // Validate slug: lowercase letters, numbers, hyphens only
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: 'Slug can only contain lowercase letters, numbers, and hyphens' });
    }
    if (slug.length < 3 || slug.length > 50) {
      return res.status(400).json({ error: 'Slug must be between 3 and 50 characters' });
    }

    // Check uniqueness (exclude current org)
    const existing = await Organization.findOne({ slug, _id: { $ne: req.orgId } });
    if (existing) return res.status(409).json({ error: 'This slug is already taken. Try another.' });

    const org = await Organization.findByIdAndUpdate(
      req.orgId,
      { slug },
      { new: true }
    );
    res.json({ slug: org.slug });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
