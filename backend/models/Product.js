import mongoose from 'mongoose';

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    helpfulVotes: {
      type: Number,
      default: 0,
    },
    votedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
  },
  {
    timestamps: true,
  }
);

const faqSchema = mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const variantSchema = mongoose.Schema({
  size: { type: String, default: '' },
  color: { type: String, default: '' },
  storage: { type: String, default: '' },
  weight: { type: String, default: '' },
  stockQuantity: { type: Number, required: true, default: 0 },
});

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
      default: 'Generic',
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0.0,
    },
    originalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['percentage', 'flat', 'none'],
      default: 'none',
    },
    discountValue: {
      type: Number,
      required: true,
      default: 0,
    },
    isBOGO: {
      type: Boolean,
      required: true,
      default: false,
    },
    dealType: {
      type: String,
      required: true,
      enum: ["Today's Deal", 'Best Deal', 'Mega Sale', 'Weekend Offer', 'Clearance Sale', 'none'],
      default: 'none',
    },
    category: {
      type: String,
      required: true,
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    images: {
      type: [String],
      required: true,
      default: [],
    },
    rating: {
      type: Number,
      required: true,
      default: 0.0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    variants: [variantSchema],
    reviews: [reviewSchema],
    faqs: [faqSchema],
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

export default Product;
export { reviewSchema };

