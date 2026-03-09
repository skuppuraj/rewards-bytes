const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('owner'));

router.get('/stats', dashboardController.getStats);

module.exports = router;
