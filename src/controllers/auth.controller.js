const User = require('../models/User.model');
const { generateToken } = require('../middleware/auth.middleware');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/helpers');

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('Email already registered');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone
  });

  // Generate token
  const token = generateToken(user._id);

  ApiResponse.created(res, 'Registration successful', {
    user,
    token
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw ApiError.forbidden('Account has been deactivated');
  }

  // Generate token
  const token = generateToken(user._id);

  // Remove password from response
  user.password = undefined;

  ApiResponse.success(res, 'Login successful', {
    user,
    token
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  ApiResponse.success(res, 'User profile retrieved', user);
});

/**
 * @desc    Logout user (client-side token removal)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // JWT is stateless, client should remove token
  ApiResponse.success(res, 'Logout successful');
});

module.exports = {
  register,
  login,
  getMe,
  logout
};
