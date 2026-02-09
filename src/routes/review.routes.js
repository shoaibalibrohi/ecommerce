const express = require('express');
const router = express.Router();

const {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview
} = require('../controllers/review.controller');

const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { reviewSchema } = require('../validators/order.validator');

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes
router.post('/product/:productId', protect, validate(reviewSchema), addReview);
router.put('/:id', protect, validate(reviewSchema), updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
