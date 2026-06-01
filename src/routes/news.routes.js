const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { getNews } = require('../controllers/news.controller');

const router = express.Router();

router.use(protect);

// @route   GET /api/news
// @desc    Get market news
// @access  Private
router.get('/', getNews);

module.exports = router;
