const express = require('express');
const router = express.Router();

const {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getProductsByCategory
} = require('../controllers/product.controller');

const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  productSchema,
  updateProductSchema,
  productQuerySchema
} = require('../validators/product.validator');

// Public routes
router.get('/', validate(productQuerySchema, 'query'), getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/id/:id', getProductById);
router.get('/:slug', getProductBySlug);

// Admin routes
router.post('/', protect, adminOnly, validate(productSchema), createProduct);
router.put('/:id', protect, adminOnly, validate(updateProductSchema), updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
