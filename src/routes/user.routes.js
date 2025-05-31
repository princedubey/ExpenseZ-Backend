const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth.middleware');
const {
  getProfile,
  updateProfile,
  updatePassword,
  getUserStats,
  getAnalytics,
} = require('../controllers/user.controller');

const router = express.Router();

// Protect all routes
router.use(protect);

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', getProfile);

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put(
  '/profile',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please include a valid email'),
  ],
  updateProfile
);

// @route   PUT /api/users/password
// @desc    Update user password
// @access  Private
router.put(
  '/password',
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ],
  updatePassword
);

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', getUserStats);

// @route   GET /api/users/analytics
// @desc    Get user financial analytics
// @access  Private
router.get('/analytics', getAnalytics);

module.exports = router; 