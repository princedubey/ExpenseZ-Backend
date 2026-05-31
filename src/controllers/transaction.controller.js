const Transaction = require('../models/transaction.model');
const { deleteKey } = require('../services/cache.service');

const invalidateDashboardCache = async (userId) => {
  await deleteKey(`dashboard:${userId}`);
};

const normalizeType = (type) => {
  if (!type) return null;
  if (type === 'income') return 'cash_in';
  if (type === 'expense') return 'cash_out';
  return type;
};

const buildDateRange = ({ month, year, startDate, endDate }) => {
  if (month || year) {
    const resolvedMonth = month ? parseInt(month, 10) - 1 : 0;
    const resolvedYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const rangeStart = new Date(resolvedYear, resolvedMonth, 1);
    const rangeEnd = new Date(resolvedYear, resolvedMonth + 1, 0, 23, 59, 59, 999);
    return { $gte: rangeStart, $lte: rangeEnd };
  }

  if (startDate || endDate) {
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);
    return dateQuery;
  }

  return null;
};

const formatTransaction = (transaction) => ({
  id: transaction._id,
  userId: transaction.user,
  title: transaction.title,
  amount: transaction.amount,
  type: transaction.type,
  category: transaction.category,
  source: transaction.source,
  note: transaction.note,
  transactionDate: transaction.transactionDate,
  date: transaction.transactionDate,
  createdAt: transaction.createdAt,
  updatedAt: transaction.updatedAt,
});

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const { type, month, year, startDate, endDate, category, page = 1, limit = 10 } = req.query;
    const query = { user: req.user.id };

    const normalizedType = normalizeType(type);
    if (normalizedType) query.type = normalizedType;
    if (category) query.category = category;

    const dateRange = buildDateRange({ month, year, startDate, endDate });
    if (dateRange) {
      query.transactionDate = dateRange;
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Transaction.countDocuments(query);

    const transactions = await Transaction.find(query)
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: transactions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: transactions.map(formatTransaction),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create transaction
// @route   POST /api/transactions
// @access  Private
exports.createTransaction = async (req, res, next) => {
  try {
    const { type, category = 'Other', transactionDate, date, title, note = '', amount, source } = req.body;

    const transaction = await Transaction.create({
      user: req.user.id,
      title,
      amount,
      type: normalizeType(type),
      source: source || 'balance',
      category,
      note,
      transactionDate: transactionDate || date || new Date(),
    });

    res.status(201).json({
      success: true,
      data: formatTransaction(transaction),
    });

    void invalidateDashboardCache(req.user.id).catch((error) => {
      console.error('Failed to invalidate dashboard cache after create:', error.message);
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: formatTransaction(transaction),
    });

    void invalidateDashboardCache(req.user.id).catch((error) => {
      console.error('Failed to invalidate dashboard cache after update:', error.message);
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
exports.updateTransaction = async (req, res, next) => {
  try {
    let transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    const { type, category = 'Other', transactionDate, date, title, note, amount, source } = req.body;

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined ? { title } : {}),
        ...(amount !== undefined ? { amount } : {}),
        ...(note !== undefined ? { note } : {}),
        type: normalizeType(type) || transaction.type,
        ...(source !== undefined ? { source } : {}),
        category,
        transactionDate: transactionDate || date || transaction.transactionDate,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      data: formatTransaction(transaction),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
exports.deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    await Transaction.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      data: {},
    });

    void invalidateDashboardCache(req.user.id).catch((error) => {
      console.error('Failed to invalidate dashboard cache after delete:', error.message);
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction summary
// @route   GET /api/transactions/summary
// @access  Private
exports.getTransactionSummary = async (req, res, next) => {
  try {
    const { month, year, startDate, endDate } = req.query;
    const query = { user: req.user.id };

    const dateRange = buildDateRange({ month, year, startDate, endDate });
    if (dateRange) {
      query.transactionDate = dateRange;
    }

    const [cashIn, cashOut, investments, investmentsFromBalance] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...query, type: 'cash_in' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { ...query, type: 'cash_out' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { ...query, type: 'investment' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { ...query, type: 'investment', source: { $ne: 'existing' } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalCashIn = cashIn[0]?.total || 0;
    const totalCashOut = cashOut[0]?.total || 0;
    const totalInvestments = investments[0]?.total || 0;
    const investedFromBalance = investmentsFromBalance[0]?.total || 0;
    const savings = totalCashIn - totalCashOut - investedFromBalance;

    res.json({
      success: true,
      data: {
        cashIn: totalCashIn,
        cashOut: totalCashOut,
        investments: totalInvestments,
        savings,
        income: totalCashIn,
        expense: totalCashOut,
        balance: savings,
      },
    });
  } catch (error) {
    next(error);
  }
}; 