const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public authentication routes
router.post('/register', register);
router.post('/login', login);

// Private profile routes
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);
router.patch('/change-password', authenticate, changePassword);

module.exports = router;

