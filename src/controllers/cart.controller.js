const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/helpers');

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id })
    .populate({
      path: 'items.product',
      select: 'name slug price discountPrice images stockQuantity isActive'
    });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Calculate totals
  let subtotal = 0;
  const validItems = [];

  for (const item of cart.items) {
    if (item.product && item.product.isActive) {
      const price = item.product.discountPrice || item.product.price;
      subtotal += price * item.quantity;
      validItems.push(item);
    }
  }

  ApiResponse.success(res, 'Cart retrieved', {
    items: validItems,
    itemCount: validItems.length,
    totalItems: validItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotal
  });
});

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/add
 * @access  Private
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, size } = req.body;

  // Verify product exists and is available
  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (!product.isActive) {
    throw ApiError.badRequest('Product is not available');
  }

  if (product.stockQuantity < quantity) {
    throw ApiError.badRequest(`Only ${product.stockQuantity} items available`);
  }

  // Get or create cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // Add item
  await cart.addItem(productId, quantity, size);

  // Populate and return
  await cart.populate({
    path: 'items.product',
    select: 'name slug price discountPrice images stockQuantity'
  });

  ApiResponse.success(res, 'Item added to cart', cart);
});

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/update
 * @access  Private
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity, size } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw ApiError.notFound('Cart not found');
  }

  // Check stock if increasing quantity
  if (quantity > 0) {
    const product = await Product.findById(productId);
    if (product && product.stockQuantity < quantity) {
      throw ApiError.badRequest(`Only ${product.stockQuantity} items available`);
    }
  }

  await cart.updateItemQuantity(productId, quantity, size);

  await cart.populate({
    path: 'items.product',
    select: 'name slug price discountPrice images stockQuantity'
  });

  ApiResponse.success(res, 'Cart updated', cart);
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/remove/:productId
 * @access  Private
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { size } = req.query;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw ApiError.notFound('Cart not found');
  }

  await cart.removeItem(productId, size);

  await cart.populate({
    path: 'items.product',
    select: 'name slug price discountPrice images stockQuantity'
  });

  ApiResponse.success(res, 'Item removed from cart', cart);
});

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  
  if (cart) {
    await cart.clearCart();
  }

  ApiResponse.success(res, 'Cart cleared');
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
