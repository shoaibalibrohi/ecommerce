const ApiError = require('../utils/ApiError');

/**
 * Validate request body/params/query against Joi schema
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      throw ApiError.badRequest('Validation failed', errors);
    }

    // Replace request data with validated/sanitized data
    req[property] = value;
    next();
  };
};

module.exports = { validate };
