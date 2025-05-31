const express = require('express');
const authRoutes = require('./auth.routes');
const transactionRoutes = require('./transaction.routes');
const userRoutes = require('./user.routes');

const router = express.Router();

// API Information
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to ExpenseZ API',
    version: '1.0.0',
    endpoints: {
      auth: {
        base: '/api/auth',
        routes: [
          { path: '/register', method: 'POST', description: 'Register a new user' },
          { path: '/login', method: 'POST', description: 'Login user' },
          { path: '/google', method: 'POST', description: 'Login with Google' },
          { path: '/refresh-token', method: 'POST', description: 'Refresh access token' },
          { path: '/logout', method: 'POST', description: 'Logout user' },
          { path: '/me', method: 'GET', description: 'Get current user' },
        ],
      },
      transactions: {
        base: '/api/transactions',
        routes: [
          { path: '/', method: 'GET', description: 'Get all transactions' },
          { path: '/', method: 'POST', description: 'Create a transaction' },
          { path: '/:id', method: 'GET', description: 'Get a single transaction' },
          { path: '/:id', method: 'PUT', description: 'Update a transaction' },
          { path: '/:id', method: 'DELETE', description: 'Delete a transaction' },
          { path: '/summary', method: 'GET', description: 'Get transaction summary' },
        ],
      },
      categories: {
        base: '/api/categories',
        routes: [
          { path: '/', method: 'GET', description: 'Get all categories' },
          { path: '/', method: 'POST', description: 'Create a category' },
          { path: '/:id', method: 'GET', description: 'Get a single category' },
          { path: '/:id', method: 'PUT', description: 'Update a category' },
          { path: '/:id', method: 'DELETE', description: 'Delete a category' },
        ],
      },
      users: {
        base: '/api/users',
        routes: [
          { path: '/profile', method: 'GET', description: 'Get user profile' },
          { path: '/profile', method: 'PUT', description: 'Update user profile' },
          { path: '/password', method: 'PUT', description: 'Update user password' },
        ],
      },
    },
  });
});

// Mount routes
router.use('/api/auth', authRoutes);
router.use('/api/transactions', transactionRoutes);
router.use('/api/users', userRoutes);

// 404 handler
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

module.exports = router; 