const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  size: {
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom', 'Free Size']
  }
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema]
}, {
  timestamps: true
});

// Method to add item to cart
cartSchema.methods.addItem = async function(productId, quantity = 1, size) {
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString() && item.size === size
  );

  if (existingItemIndex > -1) {
    this.items[existingItemIndex].quantity += quantity;
  } else {
    this.items.push({ product: productId, quantity, size });
  }

  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = function(productId, size) {
  this.items = this.items.filter(
    item => !(item.product.toString() === productId.toString() && item.size === size)
  );
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity, size) {
  const item = this.items.find(
    item => item.product.toString() === productId.toString() && item.size === size
  );
  
  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId, size);
    }
    item.quantity = quantity;
  }
  
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

// Virtual for cart totals (populated items required)
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
