const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// Register
router.post(
  '/register',
  [
    body('name').isLength({ min: 3, max: 30 }).withMessage('Name must be 3-30 characters.'),
    body('email').isEmail().withMessage('Invalid email.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
  ],
  authController.register
);

// Verify Email
router.post(
  '/verify-email',
  [
    body('email').isEmail().withMessage('Invalid email.'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits.')
  ],
  authController.verifyEmail
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Invalid email.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
  ],
  authController.login
);

module.exports = router; 