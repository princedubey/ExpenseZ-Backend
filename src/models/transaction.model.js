const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['income', 'expense'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    default: 'Other'
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now,
  },
  note: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  versionKey: false,
});

// Index for faster queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction; 