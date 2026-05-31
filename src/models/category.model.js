const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Category type is required'],
    enum: ['income', 'expense', 'investment'],
  },
  icon: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#6366F1',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

categorySchema.index({ type: 1, isDefault: 1, user: 1, name: 1 }, { unique: true });

categorySchema.virtual('userId')
  .get(function () {
    return this.user;
  })
  .set(function (value) {
    this.user = value;
  });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;