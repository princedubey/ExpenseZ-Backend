const mongoose = require('mongoose');
const Transaction = require('../models/transaction.model');
const { getMonthlyCategoryTotals } = require('../services/dashboard.service');

// @desc    Get monthly analytics
// @route   GET /api/analytics/monthly
// @access  Private
exports.getMonthlyAnalytics = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { month, year } = req.query;

    const monthValue = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const yearValue = year ? parseInt(year, 10) : new Date().getFullYear();
    const rangeStart = new Date(yearValue, monthValue - 1, 1);
    const rangeEnd = new Date(yearValue, monthValue, 0, 23, 59, 59, 999);

    const [categories, monthlyStats, investmentsFromBalanceAgg, loansFromBalanceAgg, summary, dayOfWeekStats, topTransactions, weeklyStats] = await Promise.all([
      getMonthlyCategoryTotals(userId, monthValue, yearValue),
      // 1. Monthly Stats (Historical)
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            transactionDate: { $gte: new Date(new Date().getFullYear() - 1, 0, 1) },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$transactionDate' },
              month: { $month: '$transactionDate' },
              type: '$type',
              source: '$source',
            },
            total: { $sum: '$amount' },
          },
        },
        {
          $group: {
            _id: {
              year: '$_id.year',
              month: '$_id.month',
            },
            income: {
              $sum: { $cond: [{ $eq: ['$_id.type', 'cash_in'] }, '$total', 0] },
            },
            expense: {
              $sum: { $cond: [{ $eq: ['$_id.type', 'cash_out'] }, '$total', 0] },
            },
            investments_total: {
              $sum: { $cond: [{ $eq: ['$_id.type', 'investment'] }, '$total', 0] },
            },
            investments_from_balance: {
              $sum: { $cond: [{ $and: [{ $eq: ['$_id.type', 'investment'] }, { $eq: ['$_id.source', 'balance'] }] }, '$total', 0] },
            },
            loans_total: {
              $sum: { $cond: [{ $eq: ['$_id.type', 'loan'] }, '$total', 0] },
            },
            loans_from_balance: {
              $sum: { $cond: [{ $and: [{ $eq: ['$_id.type', 'loan'] }, { $eq: ['$_id.source', 'balance'] }] }, '$total', 0] },
            },
          },
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 },
        },
      ]),
      // 2. Investments from balance
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            transactionDate: { $gte: rangeStart, $lte: rangeEnd },
            type: 'investment',
            source: 'balance',
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // 3. Loans from balance
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            transactionDate: { $gte: rangeStart, $lte: rangeEnd },
            type: 'loan',
            source: 'balance',
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // 4. Summary
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            transactionDate: { $gte: rangeStart, $lte: rangeEnd },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
      // 5. Day of Week Stats (All Time or Current Month? Let's do current month)
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            transactionDate: { $gte: rangeStart, $lte: rangeEnd },
            type: 'cash_out'
          },
        },
        {
          $group: {
            _id: { $dayOfWeek: '$transactionDate' }, // 1 = Sunday, 2 = Monday, ... 7 = Saturday
            total: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } }
      ]),
      // 6. Top 5 Transactions
      Transaction.find({
        user: userId,
        transactionDate: { $gte: rangeStart, $lte: rangeEnd },
        type: 'cash_out'
      })
      .sort({ amount: -1 })
      .limit(5)
      .select('title amount category transactionDate type'),
      // 7. Weekly Stats (Current month expenses grouped by week)
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            transactionDate: { $gte: rangeStart, $lte: rangeEnd },
            type: 'cash_out'
          },
        },
        {
          $group: {
            _id: { 
              // Rough week of month: ceiling of (day of month / 7)
              $ceil: { $divide: [{ $dayOfMonth: '$transactionDate' }, 7] }
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const lastSixMonths = [];
    const currentDate = new Date();
    for (let i = 0; i < 6; i += 1) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      lastSixMonths.unshift({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
      });
    }

    const filledMonthlyStats = lastSixMonths.map(({ year: statYear, month: statMonth }) => {
      const existingStat = monthlyStats.find(
        (stat) => stat._id.year === statYear && stat._id.month === statMonth
      );

      return {
        month: `${statYear}-${String(statMonth).padStart(2, '0')}`,
        income: existingStat?.income || 0,
        expense: existingStat?.expense || 0,
        investments: existingStat?.investments_total || 0,
        investmentsFromBalance: existingStat?.investments_from_balance || 0,
        loans: existingStat?.loans_total || 0,
        loansFromBalance: existingStat?.loans_from_balance || 0,
        balance: (existingStat?.income || 0) - (existingStat?.expense || 0) - (existingStat?.investments_from_balance || 0) - (existingStat?.loans_from_balance || 0),
      };
    });

    const totalIncome = summary.find((item) => item._id === 'cash_in')?.total || 0;
    const totalExpense = summary.find((item) => item._id === 'cash_out')?.total || 0;
    const totalInvestments = summary.find((item) => item._id === 'investment')?.total || 0;
    const totalLoans = summary.find((item) => item._id === 'loan')?.total || 0;
    const totalInvestmentsFromBalance = investmentsFromBalanceAgg[0]?.total || 0;
    const totalLoansFromBalance = loansFromBalanceAgg[0]?.total || 0;

    // Map Day of Week
    const daysMap = { 1: 'Sun', 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat' };
    const formattedDayOfWeekStats = [1, 2, 3, 4, 5, 6, 7].map(dayNum => {
      const existing = dayOfWeekStats.find(d => d._id === dayNum);
      return {
        day: daysMap[dayNum],
        total: existing ? existing.total : 0
      };
    });

    // Map Weekly Stats
    const formattedWeeklyStats = [1, 2, 3, 4, 5].map(weekNum => {
      const existing = weeklyStats.find(w => w._id === weekNum);
      return {
        week: `Week ${weekNum}`,
        total: existing ? existing.total : 0
      };
    });

    res.json({
      success: true,
      data: {
        month: monthValue,
        year: yearValue,
        categories,
        monthlyStats: filledMonthlyStats,
        spendingByCategories: categories,
        dayOfWeekStats: formattedDayOfWeekStats,
        topTransactions,
        weeklyStats: formattedWeeklyStats,
        summary: {
          totalIncome,
          totalExpense,
          totalInvestments,
          totalLoans,
          totalInvestmentsFromBalance,
          totalLoansFromBalance,
          balance: totalIncome - totalExpense - totalInvestmentsFromBalance - totalLoansFromBalance,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};