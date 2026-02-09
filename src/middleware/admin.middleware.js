const ApiError = require('../utils/ApiError');

/**
 * Restrict access to admin users only
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  if (req.user.role !== 'admin') {
    throw ApiError.forbidden('Access denied. Admin privileges required.');
  }

  next();
};

/**
 * Restrict access to specific roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(`Access denied. Required role: ${roles.join(' or ')}`);
    }

    next();
  };
};

module.exports = { adminOnly, restrictTo };
