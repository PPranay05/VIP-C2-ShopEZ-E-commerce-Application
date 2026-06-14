import React, { useContext, useState } from 'react';
import { X, ArrowLeftRight, ShoppingCart } from 'lucide-react';
import CartContext from '../context/CartContext';

const CompareTray = ({ showToast }) => {
  const { compareItems, toggleCompare, clearCompare, addToCart } = useContext(CartContext);
  const [isOpen, setIsOpen] = useState(false);

  if (compareItems.length === 0) return null;

  const handleRemove = (e, item) => {
    e.stopPropagation();
    toggleCompare(item);
  };

  const handleAddToCart = (item) => {
    let defaultVariant = null;
    if (item.variants && item.variants.length > 0) {
      defaultVariant = item.variants[0];
    }
    const result = addToCart(item, 1, defaultVariant);
    if (result && !result.success) {
      showToast(result.message, 'warning');
    } else {
      showToast(`Added "${item.name}" to cart!`, 'success');
    }
  };

  return (
    <>
      {/* Floating Compare Tray Bar at Bottom */}
      <div 
        className="compare-tray glass-panel" 
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '650px',
          padding: '16px 24px',
          borderRadius: '16px',
          zIndex: 190,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeftRight size={18} className="text-gradient" />
            <span style={{ fontWeight: '600', fontSize: '14px' }}>Compare ({compareItems.length})</span>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {compareItems.map(item => (
              <div 
                key={item._id} 
                className="compare-tray-item"
                style={{
                  position: 'relative',
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-tertiary)'
                }}
              >
                <img 
                  src={item.images[0]} 
                  alt={item.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <button 
                  onClick={(e) => handleRemove(e, item)}
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--danger)',
                    color: 'white',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--bg-secondary)'
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setIsOpen(true)}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Compare Now
          </button>
          <button 
            onClick={clearCompare}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '13px', color: 'var(--text-secondary)' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Comparison Specifications Modal */}
      {isOpen && (
        <div 
          className="modal-overlay open"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            className="modal-container glass-panel"
            style={{
              width: '90%',
              maxWidth: '850px',
              borderRadius: '24px',
              padding: '32px',
              position: 'relative',
              backgroundColor: 'var(--bg-secondary)',
              boxShadow: 'var(--shadow-lg)',
              animation: 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <button 
              onClick={() => setIsOpen(false)}
              className="close-panel-btn"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-tertiary)'
              }}
            >
              <X size={16} />
            </button>

            <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ArrowLeftRight className="text-gradient" />
              Product Comparison Guide
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table 
                style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse', 
                  fontSize: '14px', 
                  textAlign: 'left'
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '500', width: '20%' }}>Specs</th>
                    {compareItems.map(item => (
                      <th key={item._id} style={{ padding: '16px', textAlign: 'center', width: `${80 / compareItems.length}%` }}>
                        <img 
                          src={item.images[0]} 
                          alt={item.name} 
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px', marginBottom: '8px', border: '1px solid var(--border-color)' }} 
                        />
                        <h4 style={{ fontSize: '14px', margin: '4px 0', lineClamp: '2', height: '36px', overflow: 'hidden' }}>{item.name}</h4>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Price</td>
                    {compareItems.map(item => (
                      <td key={item._id} style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '700', fontSize: '16px' }} className="text-gradient">
                        ₹{item.price.toFixed(2)}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Brand</td>
                    {compareItems.map(item => (
                      <td key={item._id} style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {item.brand}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Category</td>
                    {compareItems.map(item => (
                      <td key={item._id} style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {item.category}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Rating</td>
                    {compareItems.map(item => (
                      <td key={item._id} style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div className="flex-center" style={{ gap: '4px' }}>
                          <span style={{ color: 'var(--warning)', fontWeight: '600' }}>★</span>
                          <span>{item.rating.toFixed(1)} ({item.numReviews})</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Stock Status</td>
                    {compareItems.map(item => (
                      <td key={item._id} style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: item.stockQuantity > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {item.stockQuantity > 0 ? `In Stock (${item.stockQuantity})` : 'Out of Stock'}
                      </td>
                    ))}
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Offers</td>
                    {compareItems.map(item => (
                      <td key={item._id} style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px' }}>
                        {item.discountType !== 'none' ? `-${item.discountValue}% Off` : item.isBOGO ? 'BOGO' : 'None'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td style={{ padding: '16px', fontWeight: '600', color: 'var(--text-secondary)' }}>Action</td>
                    {compareItems.map(item => (
                      <td key={item._id} style={{ padding: '16px', textAlign: 'center' }}>
                        <button 
                          onClick={() => handleAddToCart(item)}
                          className="btn-primary" 
                          style={{ padding: '8px 16px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          disabled={item.stockQuantity <= 0}
                        >
                          <ShoppingCart size={12} /> Add to Cart
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Dynamic Keyframe Animation Styles */}
      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default CompareTray;
