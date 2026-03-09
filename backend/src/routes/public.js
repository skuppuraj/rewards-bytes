const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Public routes - no auth needed (customer-facing)
router.get('/org/:slug', publicController.getOrgBySlug);
router.get('/org/:slug/games', publicController.getOrgGames);
router.post('/org/:slug/request-otp', publicController.requestWhatsAppOTP);
router.post('/org/:slug/verify-otp', publicController.verifyWhatsAppOTP);
router.post('/org/:slug/game/:gameId/start', publicController.startGame);
router.post('/org/:slug/game/:gameId/finish', publicController.finishGame);
router.post('/org/:slug/game/:gameId/feedback', publicController.submitFeedback);
router.get('/org/:slug/customer/games', publicController.getCustomerGames);
router.get('/org/:slug/customer/offers', publicController.getCustomerOffers);

module.exports = router;
