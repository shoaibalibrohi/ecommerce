const express = require('express');
const router = express.Router();

const {
  placeOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats
} = require('../controllers/order.controller');

const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validate.middleware');
const { orderSchema, updateOrderStatusSchema } = require('../validators/order.validator');

// All order routes require authentication
router.use(protect);

// User routes
router.post('/', validate(orderSchema), placeOrder);
router.get('/', getMyOrders);
router.get('/:orderNumber', getOrder);
router.put('/:id/cancel', cancelOrder);

// Admin routes
router.get('/admin/all', adminOnly, getAllOrders);
router.get('/admin/stats', adminOnly, getOrderStats);
router.put('/admin/:id/status', adminOnly, validate(updateOrderStatusSchema), updateOrderStatus);

module.exports = router;
