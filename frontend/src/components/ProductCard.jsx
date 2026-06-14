import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, ArrowLeftRight } from 'lucide-react';
import CartContext from '../context/CartContext';

const ProductCard = ({ product, showToast }) => {
  const { addToCart, toggleWishlist, wishlist, toggleCompare, compareItems } = useContext(CartContext);

  // Check if item is in wishlist & comparison
  const isInWishlist = wishlist.some((x) => x._id === product._id);
  const isInCompare = compareItems.some((x) => x._id === product._id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stockQuantity <= 0) {
      showToast('Sorry, this product is temporarily out of stock.', 'warning');
      return;
    }
    
    // Add default variant if exists
    let defaultVariant = null;
    if (product.variants && product.variants.length > 0) {
      defaultVariant = product.variants[0];
    }

    const result = addToCart(product, 1, defaultVariant);
    if (result && !result.success) {
      showToast(result.message, 'warning');
    } else {
      showToast(`Added "${product.name}" to cart!`, 'success');
    }
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleWishlist(product);
    result.then((res) => {
      if (res.added) {
        showToast(`Added "${product.name}" to wishlist!`, 'success');
      } else {
        showToast(`Removed "${product.name}" from wishlist.`, 'info');
      }
    }).catch(() => {
      // Handle non-promise fallback response
      const exists = wishlist.some((x) => x._id === product._id);
      if (!exists) {
        showToast(`Added "${product.name}" to wishlist!`, 'success');
      } else {
        showToast(`Removed "${product.name}" from wishlist.`, 'info');
      }
    });
  };

  const handleCompareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggleCompare(product);
    if (result.error) {
      showToast(result.error, 'warning');
    } else if (result.added) {
      showToast(`Added "${product.name}" to comparison!`, 'success');
    } else {
      showToast(`Removed "${product.name}" from comparison.`, 'info');
    }
  };

  // Render Star Ratings
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={13} fill="currentColor" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<Star key={i} size={13} fill="url(#halfGrad)" />);
      } else {
        stars.push(<Star key={i} size={13} />);
      }
    }
    return stars;
  };

  return (
    <div className="product-card">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="halfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" stopColor="var(--warning)" />
            <stop offset="50%" stopColor="var(--text-tertiary)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Wishlist & Compare Buttons */}
      <div className="card-actions-overlay">
        <button
          onClick={handleWishlistClick}
          className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}
          title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart size={16} fill={isInWishlist ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={handleCompareClick}
          className={`compare-btn ${isInCompare ? 'active' : ''}`}
          title={isInCompare ? 'Remove from Comparison' : 'Add to Comparison'}
          style={{
            position: 'absolute',
            top: '52px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-secondary)',
            color: isInCompare ? 'var(--accent-color)' : 'var(--text-secondary)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            transition: 'all var(--transition-fast)'
          }}
        >
          <ArrowLeftRight size={15} />
        </button>
      </div>

      {/* Product Image Link */}
      <Link to={`/product/${product._id}`}>
        <div className="card-image-wrapper">
          <img src={product.images[0] || '/images/placeholder.jpg'} alt={product.name} />
          
          {/* Sale and discount badges */}
          {product.discountType !== 'none' && (
            <span className="card-badge sale-badge">-{product.discountValue}{product.discountType === 'percentage' ? '%' : '₹'} OFF</span>
          )}
          
          {product.isBOGO && (
            <span className="card-badge bogo-badge" style={{ backgroundColor: 'var(--success)' }}>BOGO Offer</span>
          )}

          {product.stockQuantity <= 0 ? (
            <div className="out-of-stock-overlay flex-center">
              <span>Out of stock</span>
            </div>
          ) : null}
        </div>
      </Link>

      {/* Details Card */}
      <div className="card-details">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span className="product-cat">{product.category}</span>
          <span className="product-brand-tag" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            {product.brand}
          </span>
        </div>
        
        <Link to={`/product/${product._id}`}>
          <h3 className="product-title" title={product.name}>
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="rating-container">
          <span className="stars">{renderStars(product.rating)}</span>
          <span>({product.numReviews})</span>
        </div>

        {/* Stock availability dot indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginBottom: '12px' }}>
          <span 
            className="stock-indicator-dot" 
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: product.stockQuantity <= 0 ? 'var(--danger)' : product.stockQuantity <= 5 ? 'var(--warning)' : 'var(--success)' 
            }}
          ></span>
          <span style={{ color: 'var(--text-secondary)' }}>
            {product.stockQuantity <= 0 ? 'Out of Stock' : product.stockQuantity <= 5 ? `Only ${product.stockQuantity} items left` : 'In Stock'}
          </span>
        </div>

        {/* Card Footer */}
        <div className="card-footer">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {product.discountType !== 'none' ? (
              <>
                <span className="product-price">₹{product.price.toFixed(2)}</span>
                <span className="product-original-price" style={{ textDecoration: 'line-through', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  ₹{product.originalPrice.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="product-price">₹{product.price.toFixed(2)}</span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            className="add-cart-btn"
            title="Add to Cart"
            disabled={product.stockQuantity <= 0}
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
