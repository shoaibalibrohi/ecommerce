const express = require('express');
const router = express.Router();

const {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  getAllUsers
} = require('../controllers/user.controller');

const { protect } = require('../middleware/auth.middleware');
const { adminOnly } = require('../middleware/admin.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  updateProfileSchema,
  changePasswordSchema,
  addressSchema
} = require('../validators/auth.validator');

// All routes require authentication
router.use(protect);

// User routes
router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/password', validate(changePasswordSchema), changePassword);

// Address routes
router.post('/addresses', validate(addressSchema), addAddress);
router.put('/addresses/:id', validate(addressSchema), updateAddress);
router.delete('/addresses/:id', deleteAddress);

// Admin routes
router.get('/', adminOnly, getAllUsers);

module.exports = router;
