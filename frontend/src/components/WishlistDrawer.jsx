import React, { useContext } from 'react';
import { ShoppingCart, Heart, Trash, X } from 'lucide-react';
import CartContext from '../context/CartContext';

const WishlistDrawer = ({ isOpen, onClose, showToast }) => {
  const { wishlist, toggleWishlist, addToCart } = useContext(CartContext);

  const handleMoveToCart = (product) => {
    if (product.stockQuantity <= 0) {
      showToast('Sorry, this product is temporarily out of stock.', 'warning');
      return;
    }
    
    const result = addToCart(product, 1);
    if (result && !result.success) {
      showToast(result.message, 'warning');
    } else {
      // Remove from wishlist on successful add
      toggleWishlist(product);
      showToast(`Moved "${product.name}" to shopping cart!`, 'success');
    }
  };

  const handleRemove = (product) => {
    toggleWishlist(product);
    showToast(`Removed "${product.name}" from wishlist.`, 'info');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`panel-backdrop ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      ></div>

      {/* Wishlist Drawer */}
      <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Heart size={20} className="text-gradient" fill="currentColor" />
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>My Wishlist</h2>
          </div>
          <button onClick={onClose} className="close-panel-btn" title="Close Wishlist">
            <X size={18} />
          </button>
        </div>

        <div className="panel-content">
          {wishlist.length === 0 ? (
            <div
              className="flex-center"
              style={{
                height: '100%',
                flexDirection: 'column',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                gap: '12px'
              }}
            >
              <Heart size={48} style={{ strokeWidth: '1.2', color: 'var(--text-tertiary)' }} />
              <h3>Your wishlist is empty</h3>
              <p style={{ fontSize: '13px' }}>Bookmark items you love to save them here for later.</p>
              <button
                onClick={onClose}
                className="btn-secondary"
                style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '99px', fontSize: '13px' }}
              >
                Explore Products
              </button>
            </div>
          ) : (
            <div className="wishlist-list">
              {wishlist.map((item) => (
                <div key={item._id} className="wishlist-item">
                  <div className="wishlist-item-image">
                    <img src={item.images[0] || '/images/placeholder.jpg'} alt={item.name} />
                  </div>
                  
                  <div className="wishlist-item-details">
                    <h4 className="wishlist-item-title" title={item.name}>{item.name}</h4>
                    <span className="wishlist-item-price">₹{item.price.toFixed(2)}</span>
                  </div>

                  <div className="wishlist-item-actions">
                    {/* Add to Cart */}
                    <button
                      onClick={() => handleMoveToCart(item)}
                      className="wishlist-to-cart-btn"
                      title="Move to Cart"
                      disabled={item.stockQuantity <= 0}
                    >
                      <ShoppingCart size={14} />
                    </button>
                    
                    {/* Remove button */}
                    <button
                      onClick={() => handleRemove(item)}
                      className="close-panel-btn"
                      style={{ width: '32px', height: '32px' }}
                      title="Remove Item"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WishlistDrawer;
