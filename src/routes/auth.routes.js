const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth.middleware');
const {
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  getMe,
} = require('../controllers/auth.controller');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  register
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required'),
  ],
  login
);

// @route   POST /api/auth/google
// @desc    Google login
// @access  Public
router.post(
  '/google',
  [
    body('idToken').notEmpty().withMessage('ID token is required'),
  ],
  googleLogin
);

// @route   POST /api/auth/refresh-token
// @desc    Refresh access token
// @access  Public
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],
  refreshToken
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, logout);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getMe);

module.exports = router; 