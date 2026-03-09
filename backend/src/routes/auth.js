const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup', [
  body('organization_name').notEmpty().withMessage('Organization name is required'),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('mobile').notEmpty().withMessage('Mobile number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], authController.signup);

router.post('/verify-email', authController.verifyEmail);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', authController.login);
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);

module.exports = router;
