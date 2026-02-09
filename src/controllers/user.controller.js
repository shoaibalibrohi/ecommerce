const User = require('../models/User.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { asyncHandler } = require('../utils/helpers');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  ApiResponse.success(res, 'Profile retrieved', user);
});

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name, phone },
    { new: true, runValidators: true }
  );

  ApiResponse.success(res, 'Profile updated', user);
});

/**
 * @desc    Change password
 * @route   PUT /api/users/password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  ApiResponse.success(res, 'Password changed successfully');
});

/**
 * @desc    Add address
 * @route   POST /api/users/addresses
 * @access  Private
 */
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  // If this is the first address or marked as default, set others to non-default
  if (req.body.isDefault || user.addresses.length === 0) {
    user.addresses.forEach(addr => addr.isDefault = false);
    req.body.isDefault = true;
  }

  user.addresses.push(req.body);
  await user.save();

  ApiResponse.success(res, 'Address added', user.addresses);
});

/**
 * @desc    Update address
 * @route   PUT /api/users/addresses/:id
 * @access  Private
 */
const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.id);

  if (!address) {
    throw ApiError.notFound('Address not found');
  }

  // If setting as default, unset others
  if (req.body.isDefault) {
    user.addresses.forEach(addr => addr.isDefault = false);
  }

  Object.assign(address, req.body);
  await user.save();

  ApiResponse.success(res, 'Address updated', user.addresses);
});

/**
 * @desc    Delete address
 * @route   DELETE /api/users/addresses/:id
 * @access  Private
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  const addressIndex = user.addresses.findIndex(
    addr => addr._id.toString() === req.params.id
  );

  if (addressIndex === -1) {
    throw ApiError.notFound('Address not found');
  }

  user.addresses.splice(addressIndex, 1);
  await user.save();

  ApiResponse.success(res, 'Address deleted', user.addresses);
});

/**
 * @desc    Get all users (Admin)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments();

  ApiResponse.paginated(res, 'Users retrieved', users, {
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
    itemsPerPage: limit
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  getAllUsers
};
