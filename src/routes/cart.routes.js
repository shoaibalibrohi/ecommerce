const express = require('express');
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cart.controller');

const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { cartItemSchema, updateCartItemSchema } = require('../validators/order.validator');

// All cart routes require authentication
router.use(protect);

router.get('/', getCart);
router.post('/add', validate(cartItemSchema), addToCart);
router.put('/update', validate(updateCartItemSchema), updateCartItem);
router.delete('/remove/:productId', removeFromCart);
router.delete('/clear', clearCart);

module.exports = router;
