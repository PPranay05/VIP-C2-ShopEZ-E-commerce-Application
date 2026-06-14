import express from 'express';
import mongoose from 'mongoose';
import ProductMongoose from '../models/Product.js';
import { getModel } from '../utils/dbHelper.js';
const Product = getModel('Product', ProductMongoose);
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Fetch all products with search & filtering
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice, sortBy, brand, rating, discount, availability } = req.query;
    
    let query = {};

    // Search keyword query
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { brand: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'All' && category !== '') {
      query.category = category;
    }

    // Brand filter
    if (brand && brand !== 'All' && brand !== '') {
      query.brand = brand;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // Discount filter
    if (discount === 'true') {
      query.discountType = { $ne: 'none' };
    }

    // Availability filter
    if (availability === 'in-stock') {
      query.stockQuantity = { $gt: 0 };
    }

    let sortCriteria = { createdAt: -1 }; // default: newest

    // Sorting
    if (sortBy) {
      if (sortBy === 'price-asc') {
        sortCriteria = { price: 1 };
      } else if (sortBy === 'price-desc') {
        sortCriteria = { price: -1 };
      } else if (sortBy === 'rating-desc' || sortBy === 'highest-rated') {
        sortCriteria = { rating: -1 };
      } else if (sortBy === 'newest') {
        sortCriteria = { createdAt: -1 };
      } else if (sortBy === 'best-selling') {
        sortCriteria = { rating: -1, numReviews: -1 };
      } else if (sortBy === 'most-popular') {
        sortCriteria = { numReviews: -1 };
      }
    }

    // Pagination
    const page = Number(req.query.pageNumber) || 1;
    const limit = Number(req.query.limit) || 200; // default large if not specified to prevent breaking legacy
    const count = await Product.countDocuments(query);

    const products = await Product.find(query)
      .sort(sortCriteria)
      .limit(limit)
      .skip(limit * (page - 1));

    if (req.query.pageNumber || req.query.limit) {
      res.json({
        products,
        page,
        pages: Math.ceil(count / limit),
        totalProducts: count
      });
    } else {
      res.json(products);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Fetch related products
// @route   GET /api/products/:id/related
// @access  Public
router.get('/:id/related', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const related = await Product.find({
        category: product.category,
        _id: { $ne: product._id }
      }).limit(4);
      res.json(related);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Fetch single product by id
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a product review
// @route   POST /api/products/:id/reviews
// @access  Private (Customer Only)
router.post('/:id/reviews', protect, async (req, res) => {
  const { rating, comment, image } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        return res.status(400).json({ message: 'Product already reviewed by this user' });
      }

      // Check for verified purchase (user has a paid order with this product)
      const Order = mongoose.model('Order');
      const hasPurchased = await Order.findOne({
        user: req.user._id,
        isPaid: true,
        'orderItems.product': req.params.id
      });

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        image: image || '',
        isVerified: !!hasPurchased,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      
      // Calculate new average rating
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added successfully', product });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Helpful vote on product review
// @route   PUT /api/products/:id/reviews/:reviewId/helpful
// @access  Private
router.put('/:id/reviews/:reviewId/helpful', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const review = product.reviews.id(req.params.reviewId);
      if (review) {
        const alreadyVoted = review.votedUsers.some(
          (u) => u.toString() === req.user._id.toString()
        );
        if (alreadyVoted) {
          return res.status(400).json({ message: 'You have already voted this review as helpful' });
        }
        review.helpfulVotes += 1;
        review.votedUsers.push(req.user._id);
        await product.save();
        res.json({ message: 'Review marked helpful', product });
      } else {
        res.status(404).json({ message: 'Review not found' });
      }
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Ask a FAQ question on product
// @route   POST /api/products/:id/faqs
// @access  Private
router.post('/:id/faqs', protect, async (req, res) => {
  const { question } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.faqs.push({
        question,
        user: req.user._id
      });
      await product.save();
      res.status(201).json({ message: 'Question posted successfully', product });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Answer a FAQ question on product
// @route   PUT /api/products/:id/faqs/:faqId
// @access  Private (Admin Only)
router.put('/:id/faqs/:faqId', protect, adminOnly, async (req, res) => {
  const { answer } = req.body;
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      const faq = product.faqs.id(req.params.faqId);
      if (faq) {
        faq.answer = answer;
        await product.save();
        res.json({ message: 'FAQ answered successfully', product });
      } else {
        res.status(404).json({ message: 'FAQ question not found' });
      }
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin Only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const {
      name,
      price,
      originalPrice,
      description,
      image,
      category,
      stockQuantity,
      brand,
      discountType,
      discountValue,
      isBOGO,
      dealType,
      variants
    } = req.body;

    const product = new Product({
      name: name || 'Sample Product',
      price: price || 0,
      originalPrice: originalPrice || price || 0,
      user: req.user._id,
      images: image ? (Array.isArray(image) ? image : [image]) : ['/images/placeholder.jpg'],
      category: category || 'General',
      stockQuantity: stockQuantity || 0,
      description: description || 'Sample Description',
      brand: brand || 'Generic',
      discountType: discountType || 'none',
      discountValue: discountValue || 0,
      isBOGO: isBOGO || false,
      dealType: dealType || 'none',
      variants: variants || [],
      rating: 0,
      numReviews: 0,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin Only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  const {
    name,
    price,
    originalPrice,
    description,
    image,
    category,
    stockQuantity,
    brand,
    discountType,
    discountValue,
    isBOGO,
    dealType,
    variants
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name !== undefined ? name : product.name;
      product.price = price !== undefined ? price : product.price;
      product.originalPrice = originalPrice !== undefined ? originalPrice : product.originalPrice;
      product.description = description !== undefined ? description : product.description;
      if (image !== undefined) {
        product.images = Array.isArray(image) ? image : [image];
      }
      product.category = category !== undefined ? category : product.category;
      product.stockQuantity = stockQuantity !== undefined ? stockQuantity : product.stockQuantity;
      product.brand = brand !== undefined ? brand : product.brand;
      product.discountType = discountType !== undefined ? discountType : product.discountType;
      product.discountValue = discountValue !== undefined ? discountValue : product.discountValue;
      product.isBOGO = isBOGO !== undefined ? isBOGO : product.isBOGO;
      product.dealType = dealType !== undefined ? dealType : product.dealType;
      product.variants = variants !== undefined ? variants : product.variants;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin Only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: req.params.id });
      res.json({ message: 'Product removed successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

