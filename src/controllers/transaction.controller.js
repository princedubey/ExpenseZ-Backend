const Transaction = require('../models/transaction.model');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const { type, startDate, endDate, category, page = 1, limit = 10 } = req.query;
    const query = { user: req.user.id };

    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count for pagination
    const total = await Transaction.countDocuments(query);

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: transactions.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: transactions,
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
    const { type, category = 'Other', ...transactionData } = req.body;

    const transaction = await Transaction.create({
      ...transactionData,
      type,
      category,
      user: req.user.id
    });

    res.status(201).json({
      success: true,
      data: transaction,
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
      data: transaction,
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

    const { type, category = 'Other', ...transactionData } = req.body;

    transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        ...transactionData,
        type: type || transaction.type,
        category
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      data: transaction,
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
  } catch (error) {
    next(error);
  }
};

// @desc    Get transaction summary
// @route   GET /api/transactions/summary
// @access  Private
exports.getTransactionSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { user: req.user.id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const [income, expense] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...query, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { ...query, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalIncome = income[0]?.total || 0;
    const totalExpense = expense[0]?.total || 0;

    res.json({
      success: true,
      data: {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
      },
    });
  } catch (error) {
    next(error);
  }
}; 