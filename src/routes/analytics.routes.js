const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { getMonthlyAnalytics } = require('../controllers/analytics.controller');

const router = express.Router();

router.use(protect);

// @route   GET /api/analytics/monthly
// @desc    Get monthly analytics
// @access  Private
router.get('/monthly', getMonthlyAnalytics);

module.exports = router;