import express from 'express';
import CouponMongoose from '../models/Coupon.js';
import { getModel } from '../utils/dbHelper.js';
const Coupon = getModel('Coupon', CouponMongoose);
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Apply coupon code
// @route   POST /api/coupons/apply
// @access  Private
router.post('/apply', protect, async (req, res) => {
  const { code, amount } = req.body;

  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), active: true });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or inactive coupon code.' });
    }

    // Check expiry
    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'Coupon code has expired.' });
    }

    // Check minimum purchase requirements
    if (amount < coupon.minPurchase) {
      return res.status(400).json({
        message: `Minimum purchase of $${coupon.minPurchase.toFixed(2)} required to apply this coupon.`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = amount * (coupon.discountValue / 100);
    } else if (coupon.discountType === 'flat') {
      discount = coupon.discountValue;
    }

    // Cap discount to amount
    discount = Math.min(discount, amount);

    res.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Number(discount.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private (Admin Only)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a coupon
// @route   POST /api/coupons
// @access  Private (Admin Only)
router.post('/', protect, adminOnly, async (req, res) => {
  const { code, discountType, discountValue, expiryDate, minPurchase } = req.body;

  try {
    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });

    if (couponExists) {
      return res.status(400).json({ message: 'Coupon code already exists.' });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      expiryDate,
      minPurchase: Number(minPurchase || 0),
    });

    const createdCoupon = await coupon.save();
    res.status(201).json(createdCoupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a coupon
// @route   PUT /api/coupons/:id
// @access  Private (Admin Only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  const { code, discountType, discountValue, expiryDate, minPurchase, active } = req.body;

  try {
    const coupon = await Coupon.findById(req.params.id);

    if (coupon) {
      coupon.code = code ? code.toUpperCase() : coupon.code;
      coupon.discountType = discountType !== undefined ? discountType : coupon.discountType;
      coupon.discountValue = discountValue !== undefined ? Number(discountValue) : coupon.discountValue;
      coupon.expiryDate = expiryDate !== undefined ? expiryDate : coupon.expiryDate;
      coupon.minPurchase = minPurchase !== undefined ? Number(minPurchase) : coupon.minPurchase;
      coupon.active = active !== undefined ? active : coupon.active;

      const updatedCoupon = await coupon.save();
      res.json(updatedCoupon);
    } else {
      res.status(404).json({ message: 'Coupon not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private (Admin Only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (coupon) {
      await Coupon.deleteOne({ _id: req.params.id });
      res.json({ message: 'Coupon removed successfully.' });
    } else {
      res.status(404).json({ message: 'Coupon not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
