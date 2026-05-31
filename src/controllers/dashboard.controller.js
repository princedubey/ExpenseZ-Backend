const mongoose = require('mongoose');
const { getAllTimeDashboardSummary } = require('../services/dashboard.service');
const { getJson, setJson } = require('../services/cache.service');

const getDashboardCacheKey = (userId) => `dashboard:${userId}`;

// @desc    Get dashboard summary
// @route   GET /api/dashboard
// @access  Private
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const cacheKey = getDashboardCacheKey(req.user.id);

    // const cachedDashboard = await getJson(cacheKey);
    // if (cachedDashboard) {
    //   return res.json({
    //     success: true,
    //     cached: true,
    //     data: cachedDashboard,
    //   });
    // }

    const dashboard = await getAllTimeDashboardSummary(userId);
    await setJson(cacheKey, dashboard, 300);

    res.json({
      success: true,
      cached: false,
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

exports.getDashboardCacheKey = getDashboardCacheKey;