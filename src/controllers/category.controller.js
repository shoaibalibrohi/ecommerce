const Category = require('../models/Category.model');
const Product = require('../models/Product.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/helpers');

/**
 * @desc    Get all categories (tree structure)
 * @route   GET /api/categories
 * @access  Public
 */
const getCategories = asyncHandler(async (req, res) => {
  // Get root categories with children populated
  const categories = await Category.find({ parent: null, isActive: true })
    .sort('displayOrder name')
    .populate({
      path: 'children',
      match: { isActive: true },
      options: { sort: { displayOrder: 1, name: 1 } }
    });

  ApiResponse.success(res, 'Categories retrieved', categories);
});

/**
 * @desc    Get all categories (flat list for admin)
 * @route   GET /api/categories/all
 * @access  Private/Admin
 */
const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find()
    .sort('displayOrder name')
    .populate('parent', 'name slug');

  ApiResponse.success(res, 'All categories retrieved', categories);
});

/**
 * @desc    Get single category by slug
 * @route   GET /api/categories/:slug
 * @access  Public
 */
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug })
    .populate({
      path: 'children',
      match: { isActive: true }
    });

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  ApiResponse.success(res, 'Category retrieved', category);
});

/**
 * @desc    Create category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);

  ApiResponse.created(res, 'Category created', category);
});

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  // Prevent setting parent to self
  if (req.body.parent && req.body.parent === req.params.id) {
    throw ApiError.badRequest('Category cannot be its own parent');
  }

  category = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  ApiResponse.success(res, 'Category updated', category);
});

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  // Check if category has products
  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) {
    throw ApiError.badRequest(`Cannot delete category with ${productCount} products`);
  }

  // Check if category has children
  const childCount = await Category.countDocuments({ parent: req.params.id });
  if (childCount > 0) {
    throw ApiError.badRequest('Cannot delete category with subcategories');
  }

  await category.deleteOne();

  ApiResponse.success(res, 'Category deleted');
});

module.exports = {
  getCategories,
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};
