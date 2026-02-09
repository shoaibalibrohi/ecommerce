const Review = require('../models/Review.model');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/helpers');

/**
 * @desc    Get reviews for a product
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments({ product: req.params.productId });

  // Get rating distribution
  const ratingStats = await Review.aggregate([
    { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId) } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);

  ApiResponse.paginated(res, 'Reviews retrieved', {
    reviews,
    ratingDistribution: ratingStats
  }, {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    itemsPerPage: limit
  });
});

/**
 * @desc    Add review for a product
 * @route   POST /api/reviews/product/:productId
 * @access  Private
 */
const addReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, comment } = req.body;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    user: req.user._id,
    product: productId
  });

  if (existingReview) {
    throw ApiError.conflict('You have already reviewed this product');
  }

  // Check if user has purchased this product
  const hasPurchased = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    orderStatus: 'Delivered'
  });

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    title,
    comment,
    isVerifiedPurchase: !!hasPurchased
  });

  await review.populate('user', 'name');

  ApiResponse.created(res, 'Review added', review);
});

/**
 * @desc    Update review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
const updateReview = asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body;

  let review = await Review.findById(req.params.id);

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  // Check ownership
  if (review.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized to update this review');
  }

  review.rating = rating || review.rating;
  review.title = title !== undefined ? title : review.title;
  review.comment = comment !== undefined ? comment : review.comment;

  await review.save();
  await review.populate('user', 'name');

  ApiResponse.success(res, 'Review updated', review);
});

/**
 * @desc    Delete review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  // Check ownership or admin
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not authorized to delete this review');
  }

  await Review.findByIdAndDelete(req.params.id);

  ApiResponse.success(res, 'Review deleted');
});

module.exports = {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview
};
