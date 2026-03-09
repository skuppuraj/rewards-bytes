const express = require('express');
const router = express.Router();
const offersController = require('../controllers/offersController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.use(authorize('owner'));

router.get('/', offersController.getOffers);
router.post('/', upload.single('image'), offersController.createOffer);
router.put('/:id', upload.single('image'), offersController.updateOffer);
router.delete('/:id', offersController.deleteOffer);

module.exports = router;
