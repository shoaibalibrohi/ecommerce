const express = require('express');
const router = express.Router();

const {
  getCategories,
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/category.controller');

const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validate.middleware');
const { categorySchema } = require('../validators/order.validator');

// Public routes
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllCategories);
router.post('/', protect, adminOnly, validate(categorySchema), createCategory);
router.put('/:id', protect, adminOnly, validate(categorySchema), updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
