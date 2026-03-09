const express = require('express');
const router = express.Router();
const couponsController = require('../controllers/couponsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', couponsController.getCoupons);
router.patch('/:id/validity', authorize('owner'), couponsController.updateValidity);
router.delete('/:id', authorize('owner'), couponsController.deleteCoupon);
router.post('/:id/redeem', couponsController.redeemCoupon);
router.post('/:id/notify', authorize('owner'), couponsController.sendNotification);

module.exports = router;
