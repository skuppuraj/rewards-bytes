const Organization = require('../models/Organization');

exports.getOrganization = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.organization_id);
    res.json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.files?.logo) updates.logo = `/uploads/${req.files.logo[0].filename}`;
    if (req.files?.background_image) updates.background_image = `/uploads/${req.files.background_image[0].filename}`;
    if (typeof updates.settings === 'string') updates.settings = JSON.parse(updates.settings);
    if (typeof updates.social_handles === 'string') updates.social_handles = JSON.parse(updates.social_handles);
    const org = await Organization.findByIdAndUpdate(req.user.organization_id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
