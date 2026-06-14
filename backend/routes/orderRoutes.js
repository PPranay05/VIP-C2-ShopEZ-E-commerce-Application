import express from 'express';
import OrderMongoose from '../models/Order.js';
import ProductMongoose from '../models/Product.js';
import UserMongoose from '../models/User.js';
import { getModel } from '../utils/dbHelper.js';
const Order = getModel('Order', OrderMongoose);
const Product = getModel('Product', ProductMongoose);
const User = getModel('User', UserMongoose);
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Create new order & decrease stock
// @route   POST /api/orders
// @access  Private (Customer Only)
router.post('/', protect, async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentResult,
    couponCode,
    couponDiscount,
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    return res.status(400).json({ message: 'No order items provided' });
  }

  try {
    // 1. Verify and update inventory stock (including variant stock)
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        // General product stock check
        if (product.stockQuantity < item.qty) {
          return res.status(400).json({
            message: `Sorry, insufficient stock remaining for: ${product.name}. Available: ${product.stockQuantity}`,
          });
        }

        // Variant stock check
        if (product.variants && product.variants.length > 0 && (item.size || item.color || item.storage || item.weight)) {
          const variant = product.variants.find(
            (v) =>
              (!item.size || v.size === item.size) &&
              (!item.color || v.color === item.color) &&
              (!item.storage || v.storage === item.storage) &&
              (!item.weight || v.weight === item.weight)
          );

          if (variant && variant.stockQuantity < item.qty) {
            return res.status(400).json({
              message: `Sorry, insufficient stock remaining for selected variant (${item.size || ''} ${item.color || ''}) of ${product.name}. Available: ${variant.stockQuantity}`,
            });
          }
        }
      } else {
        return res.status(404).json({ message: `Product reference ${item.product} not found` });
      }
    }

    // 2. Validate and adjust Wallet payment method if selected
    if (paymentMethod === 'Wallet') {
      const user = await User.findById(req.user._id);
      if (user.walletBalance < totalPrice) {
        return res.status(400).json({
          message: `Insufficient Wallet balance. Your balance: $${user.walletBalance.toFixed(2)}. Required: $${totalPrice.toFixed(2)}`,
        });
      }
      user.walletBalance -= totalPrice;
      await user.save();
    }

    // Decrement inventory stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      
      // Decrement variant stock
      if (product.variants && product.variants.length > 0 && (item.size || item.color || item.storage || item.weight)) {
        const variant = product.variants.find(
          (v) =>
            (!item.size || v.size === item.size) &&
            (!item.color || v.color === item.color) &&
            (!item.storage || v.storage === item.storage) &&
            (!item.weight || v.weight === item.weight)
        );
        if (variant) {
          variant.stockQuantity -= item.qty;
        }
      }

      product.stockQuantity -= item.qty;
      await product.save();
    }

    // 3. Create the order
    const order = new Order({
      orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      couponCode: couponCode || '',
      couponDiscount: couponDiscount || 0.0,
      isPaid: paymentMethod !== 'Cash on Delivery', // Paid immediately except for COD
      paidAt: paymentMethod !== 'Cash on Delivery' ? Date.now() : null,
      paymentResult: {
        id: paymentResult?.id || `ch_mock_${Date.now()}`,
        status: paymentMethod === 'Cash on Delivery' ? 'pending' : 'succeeded',
        update_time: new Date().toISOString(),
        email_address: req.user.email,
      },
      status: 'Processing',
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (order) {
      // Check if user is the buyer or an admin
      if (order.user._id.toString() === req.user._id.toString() || req.user.role === 'admin') {
        res.json(order);
      } else {
        res.status(403).json({ message: 'Not authorized to view this order' });
      }
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all orders (Admin dashboard)
// @route   GET /api/orders
// @access  Private (Admin Only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update order status timeline
// @route   PUT /api/orders/:id/status
// @access  Private (Admin Only)
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.status = status;
      if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        if (order.paymentMethod === 'Cash on Delivery') {
          order.isPaid = true;
          order.paidAt = Date.now();
        }
      }
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update order status to delivered (legacy)
// @route   PUT /api/orders/:id/deliver
// @access  Private (Admin Only)
router.put('/:id/deliver', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.status = 'Delivered';
      if (order.paymentMethod === 'Cash on Delivery') {
        order.isPaid = true;
        order.paidAt = Date.now();
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

