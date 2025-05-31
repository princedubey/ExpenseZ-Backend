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