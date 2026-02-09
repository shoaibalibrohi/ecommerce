const mongoose = require('mongoose');
const { generateOrderNumber } = require('../utils/helpers');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  size: {
    type: String
  },
  image: {
    type: String
  }
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  province: {
    type: String,
    required: true
  },
  postalCode: {
    type: String
  },
  phone: {
    type: String,
    required: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['COD', 'BankTransfer', 'JazzCash', 'EasyPaisa', 'Card']
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  orderStatus: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Pending'
  },
  trackingNumber: {
    type: String
  },
  notes: {
    type: String,
    maxlength: 500
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  deliveredAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.orderNumber = generateOrderNumber();
    this.statusHistory.push({
      status: 'Pending',
      note: 'Order placed'
    });
  }
  next();
});

// Method to update order status
orderSchema.methods.updateStatus = function(status, note = '') {
  this.orderStatus = status;
  this.statusHistory.push({
    status,
    note,
    timestamp: new Date()
  });
  
  if (status === 'Delivered') {
    this.deliveredAt = new Date();
    this.paymentStatus = 'Paid';
  }
  
  if (status === 'Cancelled') {
    this.cancelledAt = new Date();
  }
  
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
