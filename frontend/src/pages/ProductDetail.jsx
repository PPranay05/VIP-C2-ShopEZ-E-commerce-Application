import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star, ShoppingCart, ArrowLeft, Send, Check, Heart, ThumbsUp, Calendar, HelpCircle, Truck } from 'lucide-react';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';

const ProductDetail = ({ showToast }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist } = useContext(CartContext);
  const { userInfo } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  
  // Selected Variant options
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedWeight, setSelectedWeight] = useState('');

  // Related & Bundle & Recently Viewed states
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [bundleItems, setBundleItems] = useState([]);
  const [checkedBundleIds, setCheckedBundleIds] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImage, setReviewImage] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // FAQ state
  const [faqQuestion, setFaqQuestion] = useState('');
  const [submittingFaq, setSubmittingFaq] = useState(false);

  const isInWishlist = wishlist.some((x) => x._id === id);

  // Fetch product detail on load or ID change
  const fetchProduct = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`http://localhost:5000/api/products/${id}`);
      setProduct(data);

      // Pre-select default variants
      if (data.variants && data.variants.length > 0) {
        const first = data.variants[0];
        setSelectedSize(first.size || '');
        setSelectedColor(first.color || '');
        setSelectedStorage(first.storage || '');
        setSelectedWeight(first.weight || '');
      }

      // Add to Recently Viewed local cache
      const stored = localStorage.getItem('shopez-recently-viewed');
      let list = [];
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch (e) {}
      }
      list = [data, ...list.filter((x) => x._id !== data._id)].slice(0, 5);
      localStorage.setItem('shopez-recently-viewed', JSON.stringify(list));
      setRecentlyViewed(list);

    } catch (error) {
      console.error('Error fetching product details:', error);
      showToast('Product not found or failed to load.', 'danger');
      navigate('/');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  // Fetch related and frequently bought together items
  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) return;
      try {
        const { data } = await axios.get(`http://localhost:5000/api/products/${product._id}/related`);
        setRelatedProducts(data);
        
        // Assemble Frequently Bought Together bundle
        if (data.length >= 2) {
          const bundle = [product, data[0], data[1]];
          setBundleItems(bundle);
          setCheckedBundleIds([product._id, data[0]._id, data[1]._id]);
        } else {
          setBundleItems([]);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchRelated();
  }, [product]);

  // Calculate Delivery Estimation Date
  const getDeliveryDateStr = () => {
    const today = new Date();
    // Delivery in 3 days
    const delivery = new Date(today);
    delivery.setDate(today.getDate() + 3);
    return delivery.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const handleAddToCart = () => {
    // Find matched variant
    let matchedVariant = null;
    if (product.variants && product.variants.length > 0) {
      matchedVariant = product.variants.find(
        (v) =>
          (!selectedSize || v.size === selectedSize) &&
          (!selectedColor || v.color === selectedColor) &&
          (!selectedStorage || v.storage === selectedStorage) &&
          (!selectedWeight || v.weight === selectedWeight)
      );
    }

    const maxStock = matchedVariant ? matchedVariant.stockQuantity : product.stockQuantity;

    if (qty > maxStock) {
      showToast(`Only ${maxStock} items available in stock for selected configuration.`, 'warning');
      return;
    }

    const result = addToCart(product, qty, matchedVariant);
    if (result && !result.success) {
      showToast(result.message, 'warning');
    } else {
      showToast(`Added ${qty} x "${product.name}" to cart!`, 'success');
    }
  };

  const handleWishlistToggle = () => {
    toggleWishlist(product).then((res) => {
      if (res.added) {
        showToast(`Added "${product.name}" to wishlist!`, 'success');
      } else {
        showToast(`Removed "${product.name}" from wishlist.`, 'info');
      }
    }).catch(() => {
      const exists = wishlist.some((x) => x._id === product._id);
      if (!exists) {
        showToast(`Added "${product.name}" to wishlist!`, 'success');
      } else {
        showToast(`Removed "${product.name}" from wishlist.`, 'info');
      }
    });
  };

  // Add all bundle checked items to cart
  const handleAddBundleToCart = () => {
    let count = 0;
    bundleItems.forEach((item) => {
      if (checkedBundleIds.includes(item._id)) {
        let defaultVariant = null;
        if (item.variants && item.variants.length > 0) {
          defaultVariant = item.variants[0];
        }
        addToCart(item, 1, defaultVariant);
        count++;
      }
    });
    showToast(`Added ${count} bundle items to cart!`, 'success');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast('Please type a comment for your review.', 'warning');
      return;
    }

    setSubmittingReview(true);
    try {
      const config = userInfo?.token
        ? { headers: { Authorization: `Bearer ${userInfo.token}` } }
        : {};
      await axios.post(`http://localhost:5000/api/products/${id}/reviews`, {
        rating,
        comment,
        image: reviewImage
      }, config);
      showToast('Review submitted successfully!', 'success');
      setComment('');
      setReviewImage('');
      setRating(5);
      fetchProduct();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to submit review.', 'danger');
    }
    setSubmittingReview(false);
  };

  const handleHelpfulVote = async (reviewId) => {
    if (!userInfo) {
      showToast('Please log in to vote reviews helpful.', 'warning');
      return;
    }
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      await axios.put(`http://localhost:5000/api/products/${id}/reviews/${reviewId}/helpful`, {}, config);
      showToast('Thank you for your feedback!', 'success');
      fetchProduct();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to register vote.', 'danger');
    }
  };

  const handleFaqSubmit = async (e) => {
    e.preventDefault();
    if (!faqQuestion.trim()) {
      showToast('Please type your question.', 'warning');
      return;
    }

    setSubmittingFaq(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      await axios.post(`http://localhost:5000/api/products/${id}/faqs`, {
        question: faqQuestion
      }, config);
      showToast('Question posted! Store admin will respond soon.', 'success');
      setFaqQuestion('');
      fetchProduct();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to post question.', 'danger');
    }
    setSubmittingFaq(false);
  };

  // Star icons utility
  const renderStars = (val, size = 14) => {
    const stars = [];
    const full = Math.floor(val);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={size}
          fill={i <= full ? 'currentColor' : 'none'}
          className={i <= full ? 'stars' : ''}
        />
      );
    }
    return stars;
  };

  // Get unique attributes for variants
  const getUniqueVariantOpts = (field) => {
    if (!product || !product.variants) return [];
    return [...new Set(product.variants.map((v) => v[field]).filter(Boolean))];
  };

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '400px', flexDirection: 'column', gap: '12px' }}>
        <div className="skeleton skeleton-circle" style={{ width: '40px', height: '40px' }}></div>
        <span style={{ color: 'var(--text-secondary)' }}>Loading details...</span>
      </div>
    );
  }

  if (!product) return null;

  const sizes = getUniqueVariantOpts('size');
  const colors = getUniqueVariantOpts('color');
  const storages = getUniqueVariantOpts('storage');
  const weights = getUniqueVariantOpts('weight');

  // Review statistics calculation
  const totalReviews = product.reviews.length;
  const ratingDistribution = [0, 0, 0, 0, 0]; // index 0 matches 1 star
  product.reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingDistribution[r.rating - 1]++;
    }
  });

  // Calculate bundle price
  const bundleTotalPrice = bundleItems.reduce((acc, curr) => {
    return acc + (checkedBundleIds.includes(curr._id) ? curr.price : 0);
  }, 0);

  return (
    <div className="container detail-page">
      {/* Back Link */}
      <Link to="/" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px', marginBottom: '28px' }}>
        <ArrowLeft size={14} /> Back to Catalog
      </Link>

      <div className="detail-layout">
        {/* Left column: Product Image */}
        <div className="detail-image-panel">
          <img src={product.images[0] || '/images/placeholder.jpg'} alt={product.name} />
          {product.discountType !== 'none' && (
            <span className="detail-discount-tag">-{product.discountValue}{product.discountType === 'percentage' ? '%' : '₹'} OFF</span>
          )}
        </div>

        {/* Right column: Details & Purchase Actions */}
        <div className="detail-info-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="detail-cat">{product.category}</span>
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>Brand: {product.brand}</span>
          </div>
          
          <h1 className="detail-title">{product.name}</h1>

          {/* Rating */}
          <div className="rating-container" style={{ fontSize: '14px', marginBottom: '20px' }}>
            <span className="stars" style={{ display: 'flex', gap: '2px' }}>
              {renderStars(product.rating, 16)}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
              {product.rating.toFixed(1)} / 5.0 ({totalReviews} customer reviews)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px' }}>
            <span className="detail-price">₹{product.price.toFixed(2)}</span>
            {product.discountType !== 'none' && (
              <span className="detail-original-price" style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)', fontSize: '18px' }}>
                ₹{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Delivery Estimation Badge */}
          <div className="delivery-badge glass-panel">
            <Truck size={18} color="var(--success)" />
            <div>
              <p>FREE Express Delivery: <strong>{getDeliveryDateStr()}</strong></p>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>If ordered within next 2 hours</span>
            </div>
          </div>

          <p className="detail-desc">{product.description}</p>

          {/* Product Variant Choices */}
          <div className="variant-selectors-wrapper" style={{ margin: '24px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Sizes */}
            {sizes.length > 0 && (
              <div>
                <span className="variant-label">Select Size</span>
                <div className="variant-options">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      className={`variant-option-chip ${selectedSize === s ? 'active' : ''}`}
                      onClick={() => setSelectedSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div>
                <span className="variant-label">Select Color</span>
                <div className="variant-options">
                  {colors.map((c) => (
                    <button
                      key={c}
                      className={`variant-option-chip ${selectedColor === c ? 'active' : ''}`}
                      onClick={() => setSelectedColor(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Storage */}
            {storages.length > 0 && (
              <div>
                <span className="variant-label">Select Storage</span>
                <div className="variant-options">
                  {storages.map((st) => (
                    <button
                      key={st}
                      className={`variant-option-chip ${selectedStorage === st ? 'active' : ''}`}
                      onClick={() => setSelectedStorage(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Weight */}
            {weights.length > 0 && (
              <div>
                <span className="variant-label">Select Weight</span>
                <div className="variant-options">
                  {weights.map((w) => (
                    <button
                      key={w}
                      className={`variant-option-chip ${selectedWeight === w ? 'active' : ''}`}
                      onClick={() => setSelectedWeight(w)}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quantity and Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
            {product.stockQuantity > 0 ? (
              <>
                <div className="quantity-control" style={{ height: '42px' }}>
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    style={{ width: '36px', height: '40px', fontSize: '16px' }}
                  >
                    -
                  </button>
                  <span style={{ width: '48px', fontSize: '15px' }}>{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stockQuantity, qty + 1))}
                    style={{ width: '36px', height: '40px', fontSize: '16px' }}
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="btn-primary"
                  style={{ height: '42px', padding: '0 32px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <ShoppingCart size={16} /> Add To Cart
                </button>
              </>
            ) : (
              <span className="stock-tag out-stock">Temporarily Out of Stock</span>
            )}

            <button
              onClick={handleWishlistToggle}
              className={`icon-btn ${isInWishlist ? 'active' : ''}`}
              title="Favorite"
              style={{ width: '42px', height: '42px', backgroundColor: 'var(--bg-tertiary)' }}
            >
              <Heart size={18} fill={isInWishlist ? 'var(--danger)' : 'none'} color={isInWishlist ? 'var(--danger)' : 'currentColor'} />
            </button>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together Bundle */}
      {bundleItems.length > 0 && (
        <section className="detail-section glass-panel" style={{ marginTop: '40px', padding: '24px', borderRadius: 'var(--border-radius-md)' }}>
          <h3 style={{ marginBottom: '16px' }}>Frequently Bought Together</h3>
          <div className="bundle-container">
            <div className="bundle-images flex-center">
              {bundleItems.map((item, idx) => (
                <React.Fragment key={item._id}>
                  <div className="bundle-img-item">
                    <img src={item.images[0]} alt={item.name} />
                    <span>{item.name.substring(0, 25)}...</span>
                  </div>
                  {idx < bundleItems.length - 1 && <span className="plus-sign">+</span>}
                </React.Fragment>
              ))}
            </div>
            
            <div className="bundle-checkboxes">
              {bundleItems.map((item) => (
                <label key={item._id} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={checkedBundleIds.includes(item._id)}
                    disabled={item._id === product._id} // can't uncheck current product
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCheckedBundleIds([...checkedBundleIds, item._id]);
                      } else {
                        setCheckedBundleIds(checkedBundleIds.filter(id => id !== item._id));
                      }
                    }}
                  />
                  <span>
                    <strong>{item._id === product._id ? 'This item' : item.name}</strong> - <span className="text-gradient">₹{item.price.toFixed(2)}</span>
                  </span>
                </label>
              ))}

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Price: </span>
                  <strong className="text-gradient" style={{ fontSize: '20px' }}>₹{bundleTotalPrice.toFixed(2)}</strong>
                </div>
                <button onClick={handleAddBundleToCart} className="btn-primary" style={{ padding: '10px 24px', fontSize: '13px' }}>
                  Add Bundle to Cart
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Customer Q&A Section */}
      <section className="detail-section" style={{ marginTop: '50px' }}>
        <h2>Customer Questions & Answers</h2>
        <div className="qa-container">
          <form onSubmit={handleFaqSubmit} className="qa-ask-form flex-center" style={{ gap: '12px', marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Have a question? Ask owner or community..."
              value={faqQuestion}
              onChange={(e) => setFaqQuestion(e.target.value)}
              style={{ flexGrow: 1 }}
              required
            />
            <button type="submit" className="btn-primary" disabled={submittingFaq} style={{ padding: '10px 24px' }}>
              Ask Question
            </button>
          </form>

          <div className="qa-list flex-column" style={{ gap: '16px' }}>
            {product.faqs.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                No questions asked yet. Post the first question above!
              </p>
            ) : (
              product.faqs.map((faq) => (
                <div key={faq._id} className="qa-item glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <HelpCircle size={18} color="var(--accent-color)" style={{ marginTop: '2px' }} />
                    <div>
                      <h4 style={{ fontSize: '15px' }}>{faq.question}</h4>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', paddingLeft: '26px' }}>
                    <Check size={16} color="var(--success)" style={{ marginTop: '3px' }} />
                    <p style={{ fontSize: '14px', color: faq.answer ? 'var(--text-primary)' : 'var(--text-tertiary)', fontStyle: faq.answer ? 'normal' : 'italic' }}>
                      {faq.answer || 'Pending response from administrator...'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Reviews & Ratings Statistics Section */}
      <section className="reviews-section" style={{ marginTop: '50px' }}>
        <h2>Customer Reviews & Ratings</h2>
        
        <div className="reviews-grid">
          {/* Reviews Rating Breakdown Card */}
          <div className="write-review-card">
            <h3>Rating Breakdown</h3>
            <div className="rating-summary flex-center" style={{ gap: '16px', margin: '16px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '48px', fontWeight: '800' }}>{product.rating.toFixed(1)}</span>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>out of 5.0</p>
              </div>
              <div>
                <span className="stars" style={{ display: 'flex', gap: '2px', color: 'var(--warning)' }}>
                  {renderStars(product.rating, 18)}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Based on {totalReviews} reviews</span>
              </div>
            </div>

            {/* Distribution bars */}
            <div className="rating-bars flex-column" style={{ gap: '8px', marginBottom: '24px' }}>
              {[5, 4, 3, 2, 1].map((starIdx) => {
                const count = ratingDistribution[starIdx - 1];
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={starIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                    <span style={{ width: '40px', textAlign: 'right' }}>{starIdx} Star</span>
                    <div style={{ flexGrow: 1, height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--warning)' }}></div>
                    </div>
                    <span style={{ width: '32px' }}>{Math.round(pct)}%</span>
                  </div>
                );
              })}
            </div>

            {/* Write a review form */}
            <h3>Share Your Thoughts</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '6px 0 20px 0' }}>
              Submit verified reviews with rating scores and photo URLs.
            </p>

            {userInfo ? (
              <form onSubmit={handleReviewSubmit} className="checkout-form">
                <div className="form-group">
                  <label>Your Rating</label>
                  <div className="rating-select">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`rating-star-btn ${star <= rating ? 'selected' : ''}`}
                        onClick={() => setRating(star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="rev-img">Optional Photo URL</label>
                  <input
                    id="rev-img"
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={reviewImage}
                    onChange={(e) => setReviewImage(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="review-comment">Review Comments</label>
                  <textarea
                    id="review-comment"
                    rows="4"
                    placeholder="Describe what you liked or disliked about this product..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      resize: 'none',
                      backgroundColor: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-sm)',
                      padding: '12px'
                    }}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    marginTop: '8px'
                  }}
                  disabled={submittingReview}
                >
                  <Send size={14} /> Submit Review
                </button>
              </form>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                  You must be logged in to leave a review.
                </p>
                <Link to="/login" className="btn-secondary" style={{ padding: '8px 20px', fontSize: '13px' }}>
                  Log In To Review
                </Link>
              </div>
            )}
          </div>

          {/* List of reviews */}
          <div className="review-list">
            {product.reviews.length === 0 ? (
              <div
                className="glass-panel"
                style={{
                  padding: '40px',
                  borderRadius: 'var(--border-radius-md)',
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}
              >
                No reviews yet. Be the first to review this product!
              </div>
            ) : (
              product.reviews.map((rev) => (
                <div key={rev._id} className="review-item glass-panel" style={{ padding: '20px', borderRadius: '12px', marginBottom: '16px' }}>
                  <div className="review-meta" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <span className="review-author" style={{ fontWeight: '600' }}>{rev.name}</span>
                      {rev.isVerified && (
                        <span className="verified-badge" style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 8px', borderRadius: '99px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', fontWeight: '600' }}>
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <span className="review-date" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {new Date(rev.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="stars" style={{ display: 'flex', gap: '2px', marginBottom: '8px', color: 'var(--warning)' }}>
                    {renderStars(rev.rating, 13)}
                  </div>
                  
                  <p className="review-comment" style={{ fontSize: '14px', marginBottom: '12px' }}>{rev.comment}</p>
                  
                  {rev.image && (
                    <div className="review-photo" style={{ marginBottom: '12px' }}>
                      <img src={rev.image} alt="Review attachment" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Was this review helpful?</span>
                    <button onClick={() => handleHelpfulVote(rev._id)} className="helpful-btn" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--accent-color)', fontWeight: '600' }}>
                      <ThumbsUp size={12} /> Yes ({rev.helpfulVotes || 0})
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="homepage-section" style={{ marginTop: '60px' }}>
          <div className="section-header">
            <h3>Customers Who Bought This Also Bought</h3>
            <p>Similar products recommended based on category matching.</p>
          </div>
          <div className="products-grid">
            {relatedProducts.map((p) => (
              <div key={p._id} className="product-card" onClick={() => { navigate(`/product/${p._id}`); window.scrollTo(0, 0); }} style={{ cursor: 'pointer' }}>
                <div className="card-image-wrapper">
                  <img src={p.images[0]} alt={p.name} />
                </div>
                <div className="card-details">
                  <span className="product-cat">{p.category}</span>
                  <h3 className="product-title">{p.name}</h3>
                  <div className="rating-container">
                    <span className="stars" style={{ color: 'var(--warning)' }}>{renderStars(p.rating, 12)}</span>
                  </div>
                  <div className="card-footer">
                    <span className="product-price">₹{p.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Products */}
      {recentlyViewed.length > 1 && (
        <section className="homepage-section" style={{ marginTop: '60px', marginBottom: '40px' }}>
          <div className="section-header">
            <h3>Your Recently Viewed Items</h3>
          </div>
          <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {recentlyViewed.filter(rv => rv._id !== product._id).map((p) => (
              <div key={p._id} className="product-card" onClick={() => { navigate(`/product/${p._id}`); window.scrollTo(0, 0); }} style={{ cursor: 'pointer', opacity: 0.85 }}>
                <div className="card-image-wrapper">
                  <img src={p.images[0]} alt={p.name} />
                </div>
                <div className="card-details">
                  <span className="product-cat">{p.category}</span>
                  <h4 style={{ fontSize: '13px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.name}</h4>
                  <span className="product-price" style={{ fontSize: '14px' }}>₹{p.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
