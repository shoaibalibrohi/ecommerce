const Product = require('../models/Product.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/helpers');

/**
 * @desc    Get all products with filtering, sorting, pagination
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    sort = '-createdAt',
    category,
    gender,
    fabricType,
    season,
    minPrice,
    maxPrice,
    size,
    search,
    isFeatured,
    isActive = true
  } = req.query;

  // Build query
  const query = { isActive };

  if (category) query.category = category;
  if (gender) query.gender = gender;
  if (fabricType) query.fabricType = fabricType;
  if (season) query.season = season;
  if (size) query.sizes = size;
  if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';

  // Price range
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Execute query
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Product.countDocuments(query);

  ApiResponse.paginated(res, 'Products retrieved', products, {
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    totalItems: total,
    itemsPerPage: parseInt(limit)
  });
});

/**
 * @desc    Get single product by slug
 * @route   GET /api/products/:slug
 * @access  Public
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('category', 'name slug');

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  ApiResponse.success(res, 'Product retrieved', product);
});

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/id/:id
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('category', 'name slug');

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  ApiResponse.success(res, 'Product retrieved', product);
});

/**
 * @desc    Create product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  await product.populate('category', 'name slug');

  ApiResponse.created(res, 'Product created', product);
});

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('category', 'name slug');

  ApiResponse.success(res, 'Product updated', product);
});

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  await product.deleteOne();

  ApiResponse.success(res, 'Product deleted');
});

/**
 * @desc    Get featured products
 * @route   GET /api/products/featured
 * @access  Public
 */
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate('category', 'name slug')
    .sort('-createdAt')
    .limit(limit);

  ApiResponse.success(res, 'Featured products retrieved', products);
});

/**
 * @desc    Get products by category
 * @route   GET /api/products/category/:categoryId
 * @access  Public
 */
const getProductsByCategory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const products = await Product.find({
    category: req.params.categoryId,
    isActive: true
  })
    .populate('category', 'name slug')
    .sort(req.query.sort || '-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Product.countDocuments({
    category: req.params.categoryId,
    isActive: true
  });

  ApiResponse.paginated(res, 'Products retrieved', products, {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    itemsPerPage: limit
  });
});

module.exports = {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByCategory
};
