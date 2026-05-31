const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');

const router = express.Router();

router.use(protect);

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', getCategories);

// @route   POST /api/categories
// @desc    Create category
// @access  Private
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('type').isIn(['income', 'expense', 'investment']).withMessage('Invalid category type'),
  ],
  validateRequest,
  createCategory
);

// @route   GET /api/categories/:id
// @desc    Get single category
// @access  Private
router.get('/:id', getCategory);

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private
router.put('/:id', updateCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private
router.delete('/:id', deleteCategory);

module.exports = router;