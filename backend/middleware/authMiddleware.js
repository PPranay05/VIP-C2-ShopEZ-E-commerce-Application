import jwt from 'jsonwebtoken';
import UserMongoose from '../models/User.js';
import { getModel } from '../utils/dbHelper.js';
const User = getModel('User', UserMongoose);

// Protect routes - Verify JWT Token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'shopez_super_secret_jwt_key_2026');

      // Get user from database (excluding password)
      req.user = await User.findById(decoded.id).select('-password');

      if (req.user && req.user.isBlocked) {
        return res.status(403).json({ message: 'Access denied. Your account is blocked by administrator.' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token verification failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Admin validation middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied, administrator role required' });
  }
};

export { protect, adminOnly };
