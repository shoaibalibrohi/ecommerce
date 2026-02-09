const Joi = require('joi');

// User registration schema
const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required'
    }),
  email: Joi.string().trim().email().lowercase().required()
    .messages({
      'string.email': 'Please enter a valid email',
      'any.required': 'Email is required'
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),
  phone: Joi.string().pattern(/^(\+92|0)?[0-9]{10}$/).allow('', null)
    .messages({
      'string.pattern.base': 'Please enter a valid Pakistani phone number'
    })
});

// Login schema
const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required()
    .messages({
      'string.email': 'Please enter a valid email',
      'any.required': 'Email is required'
    }),
  password: Joi.string().required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Update profile schema
const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  phone: Joi.string().pattern(/^(\+92|0)?[0-9]{10}$/).allow('', null)
});

// Change password schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required()
    .messages({ 'any.required': 'Current password is required' }),
  newPassword: Joi.string().min(6).required()
    .messages({
      'string.min': 'New password must be at least 6 characters',
      'any.required': 'New password is required'
    }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your new password'
    })
});

// Address schema
const addressSchema = Joi.object({
  street: Joi.string().trim().required(),
  city: Joi.string().trim().required(),
  province: Joi.string().valid('Punjab', 'Sindh', 'KPK', 'Balochistan', 'Islamabad', 'Gilgit-Baltistan', 'Azad Kashmir').required(),
  postalCode: Joi.string().trim().allow('', null),
  isDefault: Joi.boolean().default(false)
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  addressSchema
};
