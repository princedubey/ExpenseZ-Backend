const Category = require('../models/category.model');

const formatCategory = (category) => ({
  id: category._id,
  name: category.name,
  type: category.type,
  icon: category.icon,
  color: category.color,
  isDefault: category.isDefault,
  userId: category.user || null,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});

// @desc    Get all categories
// @route   GET /api/categories
// @access  Private
exports.getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;

    const query = {
      $or: [
        { isDefault: true },
        { user: req.user.id },
      ],
    };

    if (type) {
      query.type = type;
    }

    const categories = await Category.find(query)
      .sort({ isDefault: -1, type: 1, name: 1 });

    res.json({
      success: true,
      count: categories.length,
      data: categories.map(formatCategory),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      $or: [
        { isDefault: true },
        { user: req.user.id },
      ],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: formatCategory(category),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private
exports.createCategory = async (req, res, next) => {
  try {
    const { name, type, icon = '', color = '#6366F1' } = req.body;

    const category = await Category.create({
      name,
      type,
      icon,
      color,
      isDefault: false,
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: formatCategory(category),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDefault: false,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name ?? category.name,
        type: req.body.type ?? category.type,
        icon: req.body.icon ?? category.icon,
        color: req.body.color ?? category.color,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      data: formatCategory(updatedCategory),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user.id,
      isDefault: false,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    await Category.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};