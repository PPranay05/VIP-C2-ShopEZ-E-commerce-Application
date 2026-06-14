import mongoose from 'mongoose';

const couponSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'flat'],
    },
    discountValue: {
      type: Number,
      required: true,
      default: 0.0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    minPurchase: {
      type: Number,
      required: true,
      default: 0.0,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;
