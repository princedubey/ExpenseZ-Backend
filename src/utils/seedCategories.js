const mongoose = require('mongoose');
const Category = require('../models/category.model');
require('dotenv').config();

const defaultCategories = [
  // Income Categories
  {
    name: 'Salary',
    icon: 'briefcase',
    color: '#10B981', // success-600
    type: 'income',
    isDefault: true,
  },
  {
    name: 'Freelance',
    icon: 'code',
    color: '#3B82F6', // primary-600
    type: 'income',
    isDefault: true,
  },
  {
    name: 'Investments',
    icon: 'trending-up',
    color: '#8B5CF6', // secondary-600
    type: 'income',
    isDefault: true,
  },
  {
    name: 'Gifts',
    icon: 'gift',
    color: '#EC4899', // accent-600
    type: 'income',
    isDefault: true,
  },

  // Investment Categories
  {
    name: 'FD',
    icon: 'wallet',
    color: '#8B5CF6',
    type: 'investment',
    isDefault: true,
  },
  {
    name: 'RD',
    icon: 'circle-dollar-sign',
    color: '#6366F1',
    type: 'investment',
    isDefault: true,
  },
  {
    name: 'PPF',
    icon: 'shield-check',
    color: '#3B82F6',
    type: 'investment',
    isDefault: true,
  },
  {
    name: 'EPF',
    icon: 'building-2',
    color: '#0EA5E9',
    type: 'investment',
    isDefault: true,
  },
  {
    name: 'Stock',
    icon: 'trending-up',
    color: '#10B981',
    type: 'investment',
    isDefault: true,
  },
  {
    name: 'Mutual Fund',
    icon: 'pie-chart',
    color: '#14B8A6',
    type: 'investment',
    isDefault: true,
  },
  {
    name: 'ETF',
    icon: 'chart-line',
    color: '#22C55E',
    type: 'investment',
    isDefault: true,
  },
  {
    name: 'Crypto',
    icon: 'bitcoin',
    color: '#F59E0B',
    type: 'investment',
    isDefault: true,
  },
  {
    name: 'Gold',
    icon: 'crown',
    color: '#D97706',
    type: 'investment',
    isDefault: true,
  },
  {
    name: 'Real Estate',
    icon: 'home',
    color: '#6B7280',
    type: 'investment',
    isDefault: true,
  },
  {
    name: 'Other',
    icon: 'more-horizontal',
    color: '#64748B',
    type: 'investment',
    isDefault: true,
  },

  // Expense Categories
  {
    name: 'Food & Dining',
    icon: 'coffee',
    color: '#F59E0B', // warning-600
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Shopping',
    icon: 'shopping-cart',
    color: '#EF4444', // error-600
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Transportation',
    icon: 'car',
    color: '#6366F1', // primary-600
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Entertainment',
    icon: 'film',
    color: '#8B5CF6', // secondary-600
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Bills',
    icon: 'file-text',
    color: '#EC4899', // accent-600
    type: 'expense',
    isDefault: true,
  },
  {
    name: 'Health',
    icon: 'heart',
    color: '#10B981', // success-600
    type: 'expense',
    isDefault: true,
  },
];

const seedCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing default categories
    await Category.deleteMany({ isDefault: true });
    console.log('Deleted existing default categories');

    // Insert default categories
    await Category.insertMany(defaultCategories);
    console.log('Inserted default categories');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
};

seedCategories(); 