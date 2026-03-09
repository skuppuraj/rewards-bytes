const express = require('express');
const router = express.Router();
const gamesController = require('../controllers/gamesController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('owner', 'staff'));

router.get('/', gamesController.getGames);
router.get('/:id', gamesController.getGame);
router.post('/:gameId/configure', authorize('owner'), gamesController.configureGame);
router.patch('/:gameId/toggle', authorize('owner'), gamesController.toggleGame);

module.exports = router;
