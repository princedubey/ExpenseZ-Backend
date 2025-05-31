const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const mongoose = require('mongoose');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        currency: user.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        currency: user.currency,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password
// @route   PUT /api/users/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Get total income and expense
    const [income, expense] = await Promise.all([
      Transaction.aggregate([
        { 
          $match: { 
            user: userId,
            type: 'income'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ])
    ]);

    // Get last 10 transactions
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ date: -1 })
      .limit(10);

    // Get spending by categories
    const spendingByCategories = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense'
        }
      },
      {
        $group: {
          _id: '$category',
          name: { $first: '$category' },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Get income by categories
    const incomeByCategories = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'income'
        }
      },
      {
        $group: {
          _id: '$category',
          name: { $first: '$category' },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Format the response
    const response = {
      success: true,
      data: {
        totals: {
          income: income[0]?.total || 0,
          expense: expense[0]?.total || 0,
          balance: (income[0]?.total || 0) - (expense[0]?.total || 0)
        },
        recentTransactions: recentTransactions.map(transaction => ({
          _id: transaction._id,
          amount: transaction.amount,
          type: transaction.type,
          date: transaction.date,
          note: transaction.note,
          category: transaction.category
        })),
        spendingByCategories: spendingByCategories.map(category => ({
          _id: category._id,
          name: category.name,
          total: category.total
        })),
        incomeByCategories: incomeByCategories.map(category => ({
          _id: category._id,
          name: category.name,
          total: category.total
        }))
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getUserStats:', error);
    next(error);
  }
};

// @desc    Get user analytics
// @route   GET /api/users/analytics
// @access  Private
exports.getAnalytics = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get monthly income vs expense for last 6 months
    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month'
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Create array of last 6 months
    const lastSixMonths = [];
    const currentDate = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate);
      date.setMonth(currentDate.getMonth() - i);
      lastSixMonths.unshift({
        year: date.getFullYear(),
        month: date.getMonth() + 1
      });
    }

    // Fill in missing months with zero values
    const filledMonthlyStats = lastSixMonths.map(({ year, month }) => {
      const existingStat = monthlyStats.find(
        stat => stat._id.year === year && stat._id.month === month
      );

      return {
        month: `${year}-${String(month).padStart(2, '0')}`,
        income: existingStat?.income || 0,
        expense: existingStat?.expense || 0,
        balance: (existingStat?.income || 0) - (existingStat?.expense || 0)
      };
    });

    // Get spending by categories for last 6 months
    const spendingByCategories = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Get total summary
    const [totalIncome, totalExpense] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'income',
            date: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ])
    ]);

    const response = {
      success: true,
      data: {
        monthlyStats: filledMonthlyStats,
        spendingByCategories: spendingByCategories.map(category => ({
          category: category._id,
          total: category.total
        })),
        summary: {
          totalIncome: totalIncome[0]?.total || 0,
          totalExpense: totalExpense[0]?.total || 0,
          balance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0)
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    next(error);
  }
}; 