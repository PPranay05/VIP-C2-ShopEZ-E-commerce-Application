import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash, ShoppingBag, X } from 'lucide-react';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';

const CartDrawer = ({ isOpen, onClose, showToast }) => {
  const { cartItems, changeQuantity, removeFromCart, totalPrice, itemsPrice, shippingPrice, taxPrice } = useContext(CartContext);
  const { userInfo } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    if (userInfo) {
      navigate('/checkout');
    } else {
      showToast('Please log in or register to complete your purchase.', 'info');
      navigate('/login?redirect=checkout');
    }
  };

  const handleQuantityChange = (productId, change) => {
    const item = cartItems.find((x) => x.product === productId);
    if (item) {
      const newQty = item.qty + change;
      const result = changeQuantity(productId, newQty);
      if (result && !result.success) {
        showToast(result.message, 'warning');
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`panel-backdrop ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      ></div>

      {/* Cart Drawer */}
      <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={20} className="text-gradient" />
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Shopping Cart</h2>
          </div>
          <button onClick={onClose} className="close-panel-btn" title="Close Cart">
            <X size={18} />
          </button>
        </div>

        <div className="panel-content">
          {cartItems.length === 0 ? (
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
              <ShoppingBag size={48} style={{ strokeWidth: '1.2', color: 'var(--text-tertiary)' }} />
              <h3>Your cart is empty</h3>
              <p style={{ fontSize: '13px' }}>Add premium products from our catalog to get started.</p>
              <button
                onClick={onClose}
                className="btn-secondary"
                style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '99px', fontSize: '13px' }}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cart-list">
              {cartItems.map((item) => (
                <div key={item.product} className="cart-item">
                  <div className="cart-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  
                  <div className="cart-item-details">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <h4 className="cart-item-title" title={item.name}>{item.name}</h4>
                      <button
                        onClick={() => {
                          removeFromCart(item.product);
                          showToast(`Removed "${item.name}" from cart.`, 'info');
                        }}
                        className="remove-cart-item"
                        title="Remove Item"
                      >
                        <Trash size={14} />
                      </button>
                    </div>

                    <div className="cart-item-actions">
                      {/* Quantity Selector */}
                      <div className="quantity-control">
                        <button onClick={() => handleQuantityChange(item.product, -1)}>-</button>
                        <span>{item.qty}</span>
                        <button onClick={() => handleQuantityChange(item.product, 1)}>+</button>
                      </div>

                      {/* Item Price */}
                      <span className="cart-item-price">₹{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="panel-footer">
            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{itemsPrice.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shippingPrice === 0 ? 'FREE' : `₹${shippingPrice.toFixed(2)}`}</span>
              </div>
              <div className="summary-row">
                <span>Est. Sales Tax (8%)</span>
                <span>₹{taxPrice.toFixed(2)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={handleCheckout} className="btn-primary btn-checkout">
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;
