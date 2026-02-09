const Joi = require('joi');

// Create/Update product schema
const productSchema = Joi.object({
  name: Joi.string().trim().max(200).required()
    .messages({ 'any.required': 'Product name is required' }),
  brand: Joi.string().trim().max(100).allow('', null),
  category: Joi.string().hex().length(24).required()
    .messages({ 'any.required': 'Product category is required' }),
  fabricType: Joi.string().valid(
    'Cotton', 'Lawn', 'Silk', 'Chiffon', 'Linen', 'Karandi', 
    'Khaddar', 'Velvet', 'Organza', 'Net', 'Jacquard', 'Cambric'
  ).required()
    .messages({ 'any.required': 'Fabric type is required' }),
  sizes: Joi.array().items(
    Joi.string().valid('XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom', 'Free Size')
  ).min(1),
  color: Joi.string().trim().allow('', null),
  price: Joi.number().positive().required()
    .messages({ 'any.required': 'Price is required' }),
  discountPrice: Joi.number().positive().allow(null)
    .custom((value, helpers) => {
      const price = helpers.state.ancestors[0].price;
      if (value && value >= price) {
        return helpers.error('custom.discountPrice');
      }
      return value;
    })
    .messages({ 'custom.discountPrice': 'Discount price must be less than regular price' }),
  stockQuantity: Joi.number().integer().min(0).default(0),
  images: Joi.array().items(Joi.string().trim()),
  description: Joi.string().trim().max(2000).allow('', null),
  season: Joi.string().valid('Summer', 'Winter', 'Eid', 'Wedding', 'All Season', 'Spring').default('All Season'),
  gender: Joi.string().valid('Men', 'Women', 'Kids', 'Unisex').required()
    .messages({ 'any.required': 'Gender/target audience is required' }),
  isActive: Joi.boolean().default(true),
  isFeatured: Joi.boolean().default(false)
});

// Update product schema (all fields optional)
const updateProductSchema = productSchema.fork(
  ['name', 'category', 'fabricType', 'price', 'gender'],
  (schema) => schema.optional()
);

// Product query/filter schema
const productQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(12),
  sort: Joi.string().valid('price', '-price', 'name', '-name', 'createdAt', '-createdAt', 'averageRating').default('-createdAt'),
  category: Joi.string().hex().length(24),
  gender: Joi.string().valid('Men', 'Women', 'Kids', 'Unisex'),
  fabricType: Joi.string(),
  season: Joi.string(),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  size: Joi.string(),
  search: Joi.string().trim(),
  isFeatured: Joi.boolean(),
  isActive: Joi.boolean()
});

module.exports = {
  productSchema,
  updateProductSchema,
  productQuerySchema
};
