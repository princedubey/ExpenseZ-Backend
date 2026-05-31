const Transaction = require('../models/transaction.model');

const formatTransaction = (transaction) => ({
  id: transaction._id,
  title: transaction.title,
  amount: transaction.amount,
  type: transaction.type,
  category: transaction.category,
  transactionDate: transaction.transactionDate,
  createdAt: transaction.createdAt,
});

const getAllTimeDashboardSummary = async (userId) => {
  const [cashIn, cashOut, investments, loans, investmentsFromBalance, loansFromBalance, recentTransactions, topCategories] = await Promise.all([
    Transaction.aggregate([
      { $match: { user: userId, type: 'cash_in' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: 'cash_out' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: 'investment' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: 'loan' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: 'investment', source: { $ne: 'existing' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.aggregate([
      { $match: { user: userId, type: 'loan', source: { $ne: 'existing' } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Transaction.find({ user: userId })
      .sort({ transactionDate: -1, createdAt: -1 })
      .limit(5),
    Transaction.aggregate([
      { $match: { user: userId, type: 'cash_out' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const totalCashIn = cashIn[0]?.total || 0;
  const totalCashOut = cashOut[0]?.total || 0;
  const totalInvestments = investments[0]?.total || 0;
  const totalLoans = loans[0]?.total || 0;
  const investedFromBalance = investmentsFromBalance[0]?.total || 0;
  const loansFromBal = loansFromBalance[0]?.total || 0;
  const savings = totalCashIn - totalCashOut - investedFromBalance - loansFromBal;

  return {
    cashIn: totalCashIn,
    cashOut: totalCashOut,
    investments: totalInvestments,
    loans: totalLoans,
    savings,
    recentActivity: recentTransactions.map(formatTransaction),
    topCategories: topCategories.map((category) => ({
      category: category._id,
      total: category.total,
    })),
  };
};

const getMonthlyCategoryTotals = async (userId, month, year) => {
  const monthIndex = month ? parseInt(month, 10) - 1 : new Date().getMonth();
  const yearValue = year ? parseInt(year, 10) : new Date().getFullYear();
  const rangeStart = new Date(yearValue, monthIndex, 1);
  const rangeEnd = new Date(yearValue, monthIndex + 1, 0, 23, 59, 59, 999);

  const categories = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: 'cash_out',
        transactionDate: { $gte: rangeStart, $lte: rangeEnd },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
      },
    },
    {
      $sort: { total: -1 },
    },
  ]);

  return categories.map((category) => ({
    category: category._id,
    total: category.total,
  }));
};

module.exports = {
  getAllTimeDashboardSummary,
  getMonthlyCategoryTotals,
};