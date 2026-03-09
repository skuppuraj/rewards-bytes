const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customersController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('owner', 'staff'));

router.get('/', customersController.getCustomers);
router.get('/:id', customersController.getCustomer);
router.get('/:id/history', customersController.getCustomerHistory);

module.exports = router;
