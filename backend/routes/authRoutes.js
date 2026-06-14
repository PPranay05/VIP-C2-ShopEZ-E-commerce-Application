import express from 'express';
import mongoose from 'mongoose';
import UserMongoose from '../models/User.js';
import { getModel } from '../utils/dbHelper.js';
const User = getModel('User', UserMongoose);
import generateToken from '../utils/generateToken.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'customer', // Default registration is customer
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        addresses: user.addresses,
        wishlist: user.wishlist,
        walletBalance: user.walletBalance,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data provided' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {
      if (user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked by the administrator.' });
      }

      if (await user.matchPassword(password)) {
        res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          address: user.address,
          addresses: user.addresses,
          wishlist: user.wishlist,
          walletBalance: user.walletBalance,
          token: generateToken(user._id),
        });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        addresses: user.addresses,
        wishlist: user.wishlist,
        walletBalance: user.walletBalance,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      
      if (req.body.address) {
        user.address = {
          street: req.body.address.street !== undefined ? req.body.address.street : user.address.street,
          city: req.body.address.city !== undefined ? req.body.address.city : user.address.city,
          postalCode: req.body.address.postalCode !== undefined ? req.body.address.postalCode : user.address.postalCode,
          country: req.body.address.country !== undefined ? req.body.address.country : user.address.country,
        };
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        address: updatedUser.address,
        addresses: updatedUser.addresses,
        wishlist: updatedUser.wishlist,
        walletBalance: updatedUser.walletBalance,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Address Book Management Endpoints ---

// @desc    Get user address book
// @route   GET /api/auth/addresses
// @access  Private
router.get('/addresses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.addresses || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add a new address to user address book
// @route   POST /api/auth/addresses
// @access  Private
router.post('/addresses', protect, async (req, res) => {
  const { addressType, street, city, postalCode, country } = req.body;
  try {
    const user = await User.findById(req.user._id);
    user.addresses.push({ addressType, street, city, postalCode, country });
    const updatedUser = await user.save();
    res.status(201).json(updatedUser.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a specific address in address book
// @route   PUT /api/auth/addresses/:id
// @access  Private
router.put('/addresses/:id', protect, async (req, res) => {
  const { addressType, street, city, postalCode, country } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const addr = user.addresses.id(req.params.id);
    if (addr) {
      addr.addressType = addressType !== undefined ? addressType : addr.addressType;
      addr.street = street !== undefined ? street : addr.street;
      addr.city = city !== undefined ? city : addr.city;
      addr.postalCode = postalCode !== undefined ? postalCode : addr.postalCode;
      addr.country = country !== undefined ? country : addr.country;
      const updatedUser = await user.save();
      res.json(updatedUser.addresses);
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete address from address book
// @route   DELETE /api/auth/addresses/:id
// @access  Private
router.delete('/addresses/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.id);
    const updatedUser = await user.save();
    res.json(updatedUser.addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Database-synced Wishlist Endpoints ---

// @desc    Get user wishlist
// @route   GET /api/auth/wishlist
// @access  Private
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Toggle item in wishlist
// @route   POST /api/auth/wishlist/:id
// @access  Private
router.post('/wishlist/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productIndex = user.wishlist.indexOf(req.params.id);
    
    if (productIndex > -1) {
      user.wishlist.splice(productIndex, 1);
      await user.save();
      res.json({ added: false, wishlist: user.wishlist });
    } else {
      user.wishlist.push(req.params.id);
      await user.save();
      res.json({ added: true, wishlist: user.wishlist });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- Admin Customer Management Endpoints ---

// @desc    Get all customers details with order statistics
// @route   GET /api/auth/customers
// @access  Private (Admin Only)
router.get('/customers', protect, adminOnly, async (req, res) => {
  try {
    const customers = await User.find({}).select('-password');
    const Order = mongoose.model('Order');
    
    const list = await Promise.all(
      customers.map(async (c) => {
        const orderCount = await Order.countDocuments({ user: c._id });
        return {
          ...c.toObject(),
          orderCount
        };
      })
    );
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Block or unblock a customer
// @route   PUT /api/auth/customers/:id/block
// @access  Private (Admin Only)
router.put('/customers/:id/block', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'You cannot block your own admin account.' });
      }
      user.isBlocked = !user.isBlocked;
      await user.save();
      res.json({ message: `Customer ${user.name} is now ${user.isBlocked ? 'blocked' : 'unblocked'}.`, user });
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

