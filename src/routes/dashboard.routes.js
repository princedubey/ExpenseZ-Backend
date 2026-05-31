const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { getDashboard } = require('../controllers/dashboard.controller');

const router = express.Router();

router.use(protect);

// @route   GET /api/dashboard
// @desc    Get dashboard summary
// @access  Private
router.get('/', getDashboard);

module.exports = router;