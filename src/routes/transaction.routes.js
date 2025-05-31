const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
} = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Get all transactions and create transaction
router.route('/')
  .get(getTransactions)
  .post(createTransaction);

// Get transaction summary
router.get('/summary', getTransactionSummary);

// Get, update and delete single transaction
router.route('/:id')
  .get(getTransaction)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router; 