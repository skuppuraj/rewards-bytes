const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('owner'));

router.get('/', staffController.getStaff);
router.post('/', staffController.createStaff);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;
