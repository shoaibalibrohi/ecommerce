const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const Product = require('../models/Product.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/helpers');

/**
 * @desc    Place new order
 * @route   POST /api/orders
 * @access  Private
 */
const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, notes } = req.body;

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user._id })
    .populate({
      path: 'items.product',
      select: 'name price discountPrice stockQuantity images isActive'
    });

  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Cart is empty');
  }

  // Validate items and calculate totals
  const orderItems = [];
  let subtotal = 0;

  for (const item of cart.items) {
    if (!item.product || !item.product.isActive) {
      throw ApiError.badRequest('Some products are no longer available');
    }

    if (item.product.stockQuantity < item.quantity) {
      throw ApiError.badRequest(`Insufficient stock for ${item.product.name}`);
    }

    const price = item.product.discountPrice || item.product.price;
    subtotal += price * item.quantity;

    orderItems.push({
      product: item.product._id,
      name: item.product.name,
      price,
      quantity: item.quantity,
      size: item.size,
      image: item.product.images?.[0] || ''
    });
  }

  // Calculate shipping (free above PKR 3000)
  const shippingCost = subtotal >= 3000 ? 0 : 200;
  const total = subtotal + shippingCost;

  // Create order
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    subtotal,
    shippingCost,
    total,
    paymentMethod,
    notes
  });

  // Update product stock
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { 
        stockQuantity: -item.quantity,
        soldCount: item.quantity
      }
    });
  }

  // Clear cart
  await cart.clearCart();

  ApiResponse.created(res, 'Order placed successfully', order);
});

/**
 * @desc    Get user's orders
 * @route   GET /api/orders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find({ user: req.user._id })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments({ user: req.user._id });

  ApiResponse.paginated(res, 'Orders retrieved', orders, {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    itemsPerPage: limit
  });
});

/**
 * @desc    Get single order by order number
 * @route   GET /api/orders/:orderNumber
 * @access  Private
 */
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ 
    orderNumber: req.params.orderNumber 
  }).populate('user', 'name email');

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  // Check if user owns the order or is admin
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not authorized to view this order');
  }

  ApiResponse.success(res, 'Order retrieved', order);
});

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  // Check ownership
  if (order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized');
  }

  // Can only cancel pending or confirmed orders
  if (!['Pending', 'Confirmed'].includes(order.orderStatus)) {
    throw ApiError.badRequest('Order cannot be cancelled at this stage');
  }

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { 
        stockQuantity: item.quantity,
        soldCount: -item.quantity
      }
    });
  }

  await order.updateStatus('Cancelled', 'Cancelled by customer');

  ApiResponse.success(res, 'Order cancelled', order);
});

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders/admin/all
 * @access  Private/Admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  if (req.query.status) query.orderStatus = req.query.status;
  if (req.query.paymentStatus) query.paymentStatus = req.query.paymentStatus;

  const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(query);

  ApiResponse.paginated(res, 'All orders retrieved', orders, {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    itemsPerPage: limit
  });
});

/**
 * @desc    Update order status (Admin)
 * @route   PUT /api/orders/admin/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, trackingNumber, note } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (trackingNumber) {
    order.trackingNumber = trackingNumber;
  }

  await order.updateStatus(orderStatus, note);

  ApiResponse.success(res, 'Order status updated', order);
});

/**
 * @desc    Get order statistics (Admin)
 * @route   GET /api/orders/admin/stats
 * @access  Private/Admin
 */
const getOrderStats = asyncHandler(async (req, res) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$total' }
      }
    }
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: todayStart }
  });

  const todayRevenue = await Order.aggregate([
    { $match: { createdAt: { $gte: todayStart } } },
    { $group: { _id: null, total: { $sum: '$total' } } }
  ]);

  ApiResponse.success(res, 'Order statistics', {
    byStatus: stats,
    today: {
      orders: todayOrders,
      revenue: todayRevenue[0]?.total || 0
    }
  });
});

module.exports = {
  placeOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats
};
