const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/games', require('./games'));
router.use('/offers', require('./offers'));
router.use('/coupons', require('./coupons'));
router.use('/customers', require('./customers'));
router.use('/organization', require('./organization'));
router.use('/dashboard', require('./dashboard'));
router.use('/staff', require('./staff'));
router.use('/public', require('./public'));

module.exports = router;
