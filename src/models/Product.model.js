const mongoose = require('mongoose');
const { generateSlug } = require('../utils/helpers');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  fabricType: {
    type: String,
    required: [true, 'Fabric type is required'],
    enum: {
      values: ['Cotton', 'Lawn', 'Silk', 'Chiffon', 'Linen', 'Karandi', 'Khaddar', 'Velvet', 'Organza', 'Net', 'Jacquard', 'Cambric'],
      message: '{VALUE} is not a valid fabric type'
    }
  },
  sizes: [{
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom', 'Free Size']
  }],
  color: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    validate: {
      validator: function(value) {
        return !value || value < this.price;
      },
      message: 'Discount price must be less than regular price'
    }
  },
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  images: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  season: {
    type: String,
    enum: ['Summer', 'Winter', 'Eid', 'Wedding', 'All Season', 'Spring'],
    default: 'All Season'
  },
  gender: {
    type: String,
    required: [true, 'Gender/target audience is required'],
    enum: ['Men', 'Women', 'Kids', 'Unisex']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  soldCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for search and filtering optimization
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ gender: 1 });
productSchema.index({ fabricType: 1 });
productSchema.index({ season: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ name: 'text', description: 'text', brand: 'text' });

// Generate slug before saving
productSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isNew) {
    let baseSlug = generateSlug(this.name);
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure unique slug
    while (await mongoose.models.Product.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Virtual for checking if product is on sale
productSchema.virtual('isOnSale').get(function() {
  return this.discountPrice && this.discountPrice < this.price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.discountPrice || this.discountPrice >= this.price) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Virtual for effective price
productSchema.virtual('effectivePrice').get(function() {
  return this.discountPrice || this.price;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
