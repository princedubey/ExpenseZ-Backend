const express = require('express');
const { body } = require('express-validator');
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
const { validateRequest } = require('../middleware/validate.middleware');

// All routes are protected
router.use(protect);

// Get all transactions and create transaction
router.route('/')
  .get(getTransactions)
  .post(
    [
      body('title').trim().notEmpty().withMessage('Title is required'),
      body('amount').isNumeric().withMessage('Amount must be a number'),
      body('type').isIn(['cash_in', 'cash_out', 'investment', 'income', 'expense']).withMessage('Invalid transaction type'),
      body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
    ],
    validateRequest,
    createTransaction
  );

// Get transaction summary
router.get('/summary', getTransactionSummary);

// Get, update and delete single transaction
router.route('/:id')
  .get(getTransaction)
  .put(
    [
      body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
      body('amount').optional().isNumeric().withMessage('Amount must be a number'),
      body('type').optional().isIn(['cash_in', 'cash_out', 'investment', 'income', 'expense']).withMessage('Invalid transaction type'),
      body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
    ],
    validateRequest,
    updateTransaction
  )
  .delete(deleteTransaction);

module.exports = router; 