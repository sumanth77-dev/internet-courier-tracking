const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public authentication routes
router.post('/register', register);
router.post('/login', login);

// Private profile route
router.get('/me', authenticate, getMe);

module.exports = router;

