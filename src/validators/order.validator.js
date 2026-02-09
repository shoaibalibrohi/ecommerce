const Joi = require('joi');

// Place order schema
const orderSchema = Joi.object({
  shippingAddress: Joi.object({
    fullName: Joi.string().trim().required()
      .messages({ 'any.required': 'Full name is required' }),
    street: Joi.string().trim().required()
      .messages({ 'any.required': 'Street address is required' }),
    city: Joi.string().trim().required()
      .messages({ 'any.required': 'City is required' }),
    province: Joi.string().trim().required()
      .messages({ 'any.required': 'Province is required' }),
    postalCode: Joi.string().trim().allow('', null),
    phone: Joi.string().pattern(/^(\+92|0)?[0-9]{10}$/).required()
      .messages({
        'any.required': 'Phone number is required',
        'string.pattern.base': 'Please enter a valid Pakistani phone number'
      })
  }).required(),
  paymentMethod: Joi.string().valid('COD', 'BankTransfer', 'JazzCash', 'EasyPaisa', 'Card').required()
    .messages({ 'any.required': 'Payment method is required' }),
  notes: Joi.string().trim().max(500).allow('', null)
});

// Update order status schema (for admin)
const updateOrderStatusSchema = Joi.object({
  orderStatus: Joi.string().valid('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned').required(),
  trackingNumber: Joi.string().trim().allow('', null),
  note: Joi.string().trim().max(200).allow('', null)
});

// Cart item schema
const cartItemSchema = Joi.object({
  productId: Joi.string().hex().length(24).required()
    .messages({ 'any.required': 'Product ID is required' }),
  quantity: Joi.number().integer().min(1).default(1),
  size: Joi.string().valid('XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom', 'Free Size').allow('', null)
});

// Update cart item schema
const updateCartItemSchema = Joi.object({
  productId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(0).required(),
  size: Joi.string().allow('', null)
});

// Review schema
const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required()
    .messages({ 'any.required': 'Rating is required' }),
  title: Joi.string().trim().max(100).allow('', null),
  comment: Joi.string().trim().max(1000).allow('', null)
});

// Category schema
const categorySchema = Joi.object({
  name: Joi.string().trim().max(100).required()
    .messages({ 'any.required': 'Category name is required' }),
  description: Joi.string().trim().max(500).allow('', null),
  parent: Joi.string().hex().length(24).allow(null),
  image: Joi.string().trim().allow('', null),
  isActive: Joi.boolean().default(true),
  displayOrder: Joi.number().integer().default(0)
});

module.exports = {
  orderSchema,
  updateOrderStatusSchema,
  cartItemSchema,
  updateCartItemSchema,
  reviewSchema,
  categorySchema
};
