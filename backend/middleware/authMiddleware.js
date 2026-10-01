const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Protects routes by verifying JWT in the Authorization header
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check if Authorization header is present and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    // 2. Extract token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Malformed authentication token.',
      });
    }

    // 3. Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured in environment variables');
    }

    const decoded = jwt.verify(token, secret);

    // 4. Attach user data to request object
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
};

/**
 * Role Authorization Middleware
 * Restricts access to specific user roles
 * @param {...string} roles - Allowed roles (e.g. 'customer', 'courier', 'admin')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access denied. Only ${roles.join(', ')} roles can access this resource.`,
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles,
};

