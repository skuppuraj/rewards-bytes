const express = require('express');
const router = express.Router();
const orgController = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.use(authorize('owner'));

router.get('/', orgController.getOrganization);
router.put('/', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'background_image', maxCount: 1 }]), orgController.updateOrganization);

module.exports = router;
