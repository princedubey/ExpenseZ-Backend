const mongoose = require('mongoose');

const normalizeTransactionType = (value) => {
  if (value === 'income') return 'cash_in';
  if (value === 'expense') return 'cash_out';
  return value;
};

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['cash_in', 'cash_out', 'investment', 'loan'],
    set: normalizeTransactionType,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    default: 'Other',
  },
  source: {
    type: String,
    enum: ['balance', 'existing'],
    default: 'balance',
  },
  transactionDate: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now,
  },
  note: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

transactionSchema.virtual('date')
  .get(function () {
    return this.transactionDate;
  })
  .set(function (value) {
    this.transactionDate = value;
  });

transactionSchema.virtual('userId')
  .get(function () {
    return this.user;
  })
  .set(function (value) {
    this.user = value;
  });

// Index for faster queries
transactionSchema.index({ user: 1, transactionDate: -1 });
transactionSchema.index({ user: 1, type: 1, transactionDate: -1 });
transactionSchema.index({ user: 1, category: 1, transactionDate: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 