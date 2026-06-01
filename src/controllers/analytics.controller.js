const mongoose = require('mongoose');
const Transaction = require('../models/transaction.model');

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

    // Last 3 months for contextual charts
    const last3MonthsStart = new Date();
    last3MonthsStart.setMonth(last3MonthsStart.getMonth() - 2);
    last3MonthsStart.setDate(1);
    last3MonthsStart.setHours(0, 0, 0, 0);

    const [
      monthlyStats,
      summaryAgg,
      dayOfWeekStats,
      topTransactions,
      weeklyStats,
      allTimeSpending,
      currentMonthSpending,
    ] = await Promise.all([
      // 1. Monthly Stats — ALL months with data (no date filter, include all history)
      Transaction.aggregate([
        { $match: { user: userId } },
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
            _id: { year: '$_id.year', month: '$_id.month' },
            income: { $sum: { $cond: [{ $eq: ['$_id.type', 'cash_in'] }, '$total', 0] } },
            expense: { $sum: { $cond: [{ $eq: ['$_id.type', 'cash_out'] }, '$total', 0] } },
            investments_total: { $sum: { $cond: [{ $eq: ['$_id.type', 'investment'] }, '$total', 0] } },
            investments_from_balance: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$_id.type', 'investment'] }, { $eq: ['$_id.source', 'balance'] }] },
                  '$total', 0,
                ],
              },
            },
            loans_total: { $sum: { $cond: [{ $eq: ['$_id.type', 'loan'] }, '$total', 0] } },
            loans_from_balance: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$_id.type', 'loan'] }, { $eq: ['$_id.source', 'balance'] }] },
                  '$total', 0,
                ],
              },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),

      // 2. ALL-TIME summary by type
      Transaction.aggregate([
        { $match: { user: userId } },
        { $group: { _id: { type: '$type', source: '$source' }, total: { $sum: '$amount' } } },
      ]),

      // 3. Day-of-week stats — last 3 months expenses
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'cash_out',
            transactionDate: { $gte: last3MonthsStart },
          },
        },
        { $group: { _id: { $dayOfWeek: '$transactionDate' }, total: { $sum: '$amount' } } },
        { $sort: { _id: 1 } },
      ]),

      // 4. Top 5 largest expenses — ALL TIME
      Transaction.find({ user: userId, type: 'cash_out' })
        .sort({ amount: -1 })
        .limit(5)
        .select('title amount category transactionDate type'),

      // 5. Weekly stats — current selected month expenses
      Transaction.aggregate([
        {
          $match: {
            user: userId,
            transactionDate: { $gte: rangeStart, $lte: rangeEnd },
            type: 'cash_out',
          },
        },
        {
          $group: {
            _id: { $ceil: { $divide: [{ $dayOfMonth: '$transactionDate' }, 7] } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // 6. All-time spending by category
      Transaction.aggregate([
        { $match: { user: userId, type: 'cash_out' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),

      // 7. Current month spending by category
      Transaction.aggregate([
        { $match: { user: userId, type: 'cash_out', transactionDate: { $gte: rangeStart, $lte: rangeEnd } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
    ]);

    // ── Build last 12 months scaffold ──────────────────────────────────────────
    const last12Months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last12Months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    const filledMonthlyStats = last12Months.map(({ year: sy, month: sm }) => {
      const found = monthlyStats.find((s) => s._id.year === sy && s._id.month === sm);
      const inc = found?.income || 0;
      const exp = found?.expense || 0;
      const inv = found?.investments_total || 0;
      const invBal = found?.investments_from_balance || 0;
      const loan = found?.loans_total || 0;
      const loanBal = found?.loans_from_balance || 0;
      return {
        month: `${sy}-${String(sm).padStart(2, '0')}`,
        income: inc,
        expense: exp,
        investments: inv,
        investmentsFromBalance: invBal,
        loans: loan,
        loansFromBalance: loanBal,
        // True net savings: income minus direct cash outflows from balance
        savings: inc - exp - invBal - loanBal,
        balance: inc - exp - invBal - loanBal,
      };
    });

    // ── Compute ALL-TIME summary ───────────────────────────────────────────────
    const totalIncome = summaryAgg
      .filter((s) => s._id.type === 'cash_in')
      .reduce((acc, s) => acc + s.total, 0);

    const totalExpense = summaryAgg
      .filter((s) => s._id.type === 'cash_out')
      .reduce((acc, s) => acc + s.total, 0);

    const totalInvestments = summaryAgg
      .filter((s) => s._id.type === 'investment')
      .reduce((acc, s) => acc + s.total, 0);

    const totalLoans = summaryAgg
      .filter((s) => s._id.type === 'loan')
      .reduce((acc, s) => acc + s.total, 0);

    // "from balance" = real cash outflow (source = 'balance', NOT 'existing')
    const totalInvestmentsFromBalance = summaryAgg
      .filter((s) => s._id.type === 'investment' && s._id.source === 'balance')
      .reduce((acc, s) => acc + s.total, 0);

    const totalLoansFromBalance = summaryAgg
      .filter((s) => s._id.type === 'loan' && s._id.source === 'balance')
      .reduce((acc, s) => acc + s.total, 0);

    // True net balance: income − expenses − cash-out investments − cash-out loans
    const netBalance = totalIncome - totalExpense - totalInvestmentsFromBalance - totalLoansFromBalance;

    // ── Day of Week ───────────────────────────────────────────────────────────
    const daysMap = { 1: 'Sun', 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat' };
    const formattedDayOfWeekStats = [1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
      const existing = dayOfWeekStats.find((d) => d._id === dayNum);
      return { day: daysMap[dayNum], total: existing ? existing.total : 0 };
    });

    // ── Weekly Stats ─────────────────────────────────────────────────────────
    const formattedWeeklyStats = [1, 2, 3, 4, 5].map((weekNum) => {
      const existing = weeklyStats.find((w) => w._id === weekNum);
      return { week: `Wk ${weekNum}`, total: existing ? existing.total : 0 };
    });

    res.json({
      success: true,
      data: {
        month: monthValue,
        year: yearValue,
        monthlyStats: filledMonthlyStats,
        spendingByCategories: allTimeSpending.map((c) => ({ category: c._id, total: c.total })),
        currentMonthCategories: currentMonthSpending.map((c) => ({ category: c._id, total: c.total })),
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
          netBalance,
          // For convenience
          netSavings: netBalance,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};