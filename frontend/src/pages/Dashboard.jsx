import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, MapPin, Package, Heart, Star, CreditCard, ChevronRight, Edit, Trash2, Plus, RefreshCw, Eye } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';

const Dashboard = ({ showToast }) => {
  const { userInfo, updateProfile } = useContext(AuthContext);
  const { addToCart, toggleWishlist } = useContext(CartContext);
  const navigate = useNavigate();

  // Tab State: 'profile' | 'addresses' | 'orders' | 'wishlist'
  const [activeTab, setActiveTab] = useState('orders');

  // Profile Form State
  const [name, setName] = useState(userInfo?.name || '');
  const [email, setEmail] = useState(userInfo?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isEditAddressMode, setIsEditAddressMode] = useState(false);
  const [currentAddressId, setCurrentAddressId] = useState(null);
  const [addressType, setAddressType] = useState('Home');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  // Orders and Wishlist States
  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!userInfo) {
      navigate('/login?redirect=dashboard');
    } else {
      fetchAddresses();
      fetchOrders();
      fetchWishlist();
    }
  }, [userInfo]);

  const fetchAddresses = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('http://localhost:5000/api/auth/addresses', config);
      setAddresses(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('http://localhost:5000/api/orders/myorders', config);
      setOrders(data);
    } catch (err) {
      console.error(err);
    }
    setLoadingOrders(false);
  };

  const fetchWishlist = async () => {
    setLoadingWishlist(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('http://localhost:5000/api/auth/wishlist', config);
      setWishlistItems(data);
    } catch (err) {
      console.error(err);
    }
    setLoadingWishlist(false);
  };

  // Profile Submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'warning');
      return;
    }

    setUpdatingProfile(true);
    try {
      const result = await updateProfile({ name, email, password });
      if (result.success) {
        showToast('Profile updated successfully!', 'success');
        setPassword('');
        setConfirmPassword('');
      } else {
        showToast(result.message || 'Update failed.', 'danger');
      }
    } catch (err) {
      showToast('Profile update error.', 'danger');
    }
    setUpdatingProfile(false);
  };

  // Address Book CRUD
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!street || !city || !postalCode || !country) {
      showToast('Please fill out all address fields.', 'warning');
      return;
    }

    const payload = { addressType, street, city, postalCode, country };
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

    try {
      if (isEditAddressMode) {
        const { data } = await axios.put(`http://localhost:5000/api/auth/addresses/${currentAddressId}`, payload, config);
        setAddresses(data);
        showToast('Address updated successfully!', 'success');
      } else {
        const { data } = await axios.post('http://localhost:5000/api/auth/addresses', payload, config);
        setAddresses(data);
        showToast('Address added to address book!', 'success');
      }
      setShowAddressModal(false);
      resetAddressForm();
    } catch (err) {
      showToast('Failed to save address.', 'danger');
    }
  };

  const openEditAddressModal = (addr) => {
    setIsEditAddressMode(true);
    setCurrentAddressId(addr._id);
    setAddressType(addr.addressType || 'Home');
    setStreet(addr.street);
    setCity(addr.city);
    setPostalCode(addr.postalCode);
    setCountry(addr.country);
    setShowAddressModal(true);
  };

  const openAddAddressModal = () => {
    setIsEditAddressMode(false);
    resetAddressForm();
    setShowAddressModal(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Delete this address?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.delete(`http://localhost:5000/api/auth/addresses/${addressId}`, config);
        setAddresses(data);
        showToast('Address removed from address book.', 'success');
      } catch (err) {
        showToast('Failed to delete address.', 'danger');
      }
    }
  };

  const resetAddressForm = () => {
    setCurrentAddressId(null);
    setAddressType('Home');
    setStreet('');
    setCity('');
    setPostalCode('');
    setCountry('');
  };

  // Move wishlist item to cart
  const handleMoveWishlistToCart = (product) => {
    let defaultVariant = null;
    if (product.variants && product.variants.length > 0) {
      defaultVariant = product.variants[0];
    }
    const result = addToCart(product, 1, defaultVariant);
    if (result && !result.success) {
      showToast(result.message, 'warning');
    } else {
      // Remove from wishlist
      toggleWishlist(product).then(() => {
        fetchWishlist();
        showToast(`Moved "${product.name}" to cart!`, 'success');
      });
    }
  };

  // Render Order Tracking Status Timeline Progress Bar
  const renderTrackingTimeline = (status) => {
    const stages = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentIdx = stages.indexOf(status);

    return (
      <div className="tracking-timeline-wrapper" style={{ margin: '20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '8px' }}>
          {/* Connecting Line */}
          <div 
            style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '5%', 
              right: '5%', 
              height: '3px', 
              backgroundColor: 'var(--border-color)', 
              zIndex: 1, 
              transform: 'translateY(-50%)' 
            }}
          ></div>
          <div 
            style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '5%', 
              width: `${(currentIdx / (stages.length - 1)) * 90}%`, 
              height: '3px', 
              backgroundColor: 'var(--success)', 
              zIndex: 1, 
              transform: 'translateY(-50%)',
              transition: 'width 0.4s ease'
            }}
          ></div>

          {/* Node dots */}
          {stages.map((stage, idx) => {
            const isCompleted = idx <= currentIdx;
            const isCurrent = idx === currentIdx;
            return (
              <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '18%' }}>
                <div 
                  style={{ 
                    width: '20px', 
                    height: '20px', 
                    borderRadius: '50%', 
                    backgroundColor: isCompleted ? 'var(--success)' : 'var(--bg-secondary)', 
                    border: `3px solid ${isCompleted ? 'var(--success)' : 'var(--border-color)'}`,
                    boxShadow: isCurrent ? '0 0 10px var(--success)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isCompleted && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                </div>
                <span 
                  style={{ 
                    fontSize: '11px', 
                    marginTop: '6px', 
                    fontWeight: isCurrent ? '700' : '500',
                    color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textAlign: 'center'
                  }}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="container dashboard-page" style={{ paddingTop: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1>My Account Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Manage your profile, multiple shipping address details, and track e-commerce order progress.
          </p>
        </div>
        <div className="wallet-card glass-panel" style={{ padding: '12px 24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Simulated Wallet Balance</span>
          <strong className="text-gradient" style={{ fontSize: '20px' }}>₹{(userInfo?.walletBalance || 40000.00).toFixed(2)}</strong>
        </div>
      </div>

      <div className="admin-layout" style={{ marginTop: '32px' }}>
        {/* Sidebar tabs navigation */}
        <aside className="admin-menu">
          <button
            onClick={() => setActiveTab('orders')}
            className={`admin-menu-item ${activeTab === 'orders' ? 'active' : ''}`}
          >
            <Package size={16} /> Order Tracking
          </button>
          
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`admin-menu-item ${activeTab === 'wishlist' ? 'active' : ''}`}
          >
            <Heart size={16} /> Wishlist Catalog
          </button>
          
          <button
            onClick={() => setActiveTab('addresses')}
            className={`admin-menu-item ${activeTab === 'addresses' ? 'active' : ''}`}
          >
            <MapPin size={16} /> Saved Addresses
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`admin-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <User size={16} /> Account Profile
          </button>
        </aside>

        {/* Tab content panel */}
        <main className="admin-content-panel">
          {/* TAB: Order History with Interactive tracking */}
          {activeTab === 'orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Track My Orders</h3>
                <button onClick={fetchOrders} className="btn-secondary" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <RefreshCw size={12} /> Sync
                </button>
              </div>

              {loadingOrders ? (
                <p style={{ color: 'var(--text-secondary)' }}>Loading orders...</p>
              ) : orders.length === 0 ? (
                <div className="empty-state glass-panel" style={{ borderRadius: '16px' }}>
                  <Package size={36} style={{ color: 'var(--text-tertiary)' }} />
                  <h3>No Orders Found</h3>
                  <p>Start shopping from our catalog to see tracking timelines here.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order._id} className="order-details-card glass-panel" style={{ padding: '24px', borderRadius: '16px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ORDER ID</span>
                        <h4 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{order._id}</h4>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>DATE PLACED</span>
                        <h4 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{new Date(order.createdAt).toLocaleDateString()}</h4>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>TOTAL PAID</span>
                        <h4 style={{ fontSize: '14px', color: 'var(--text-primary)' }} className="text-gradient">₹{order.totalPrice.toFixed(2)}</h4>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>PAYMENT METHOD</span>
                        <h4 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{order.paymentMethod}</h4>
                      </div>
                    </div>

                    {/* Timeline */}
                    {renderTrackingTimeline(order.status || 'Processing')}

                    {/* Ordered Items Preview */}
                    <div className="order-items-preview" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {order.orderItems.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: idx < order.orderItems.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                            <div>
                              <span style={{ fontSize: '13px', fontWeight: '600' }}>{item.name}</span>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                Qty: {item.qty} &times; ₹{item.price.toFixed(2)}
                                {(item.size || item.color) && ` | Config: ${item.size || ''} ${item.color || ''}`}
                              </div>
                            </div>
                          </div>
                          <strong style={{ fontSize: '13px' }}>₹{(item.price * item.qty).toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: Database-Synced Wishlist Catalog */}
          {activeTab === 'wishlist' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>My Wishlist Items</h3>
                <button onClick={fetchWishlist} className="btn-secondary" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <RefreshCw size={12} /> Sync
                </button>
              </div>

              {loadingWishlist ? (
                <p style={{ color: 'var(--text-secondary)' }}>Syncing wishlist...</p>
              ) : wishlistItems.length === 0 ? (
                <div className="empty-state glass-panel" style={{ borderRadius: '16px' }}>
                  <Heart size={36} style={{ color: 'var(--text-tertiary)' }} />
                  <h3>Your Wishlist is Empty</h3>
                  <p>Browse products and click the heart icon to add them here.</p>
                </div>
              ) : (
                <div className="products-grid">
                  {wishlistItems.map((prod) => (
                    <div key={prod._id} className="product-card" style={{ paddingBottom: '16px' }}>
                      <div className="card-image-wrapper">
                        <img src={prod.images[0]} alt={prod.name} />
                      </div>
                      <div className="card-details" style={{ flexGrow: 1 }}>
                        <span className="product-cat">{prod.category}</span>
                        <h3 className="product-title" style={{ fontSize: '14px', height: '36px', overflow: 'hidden' }}>{prod.name}</h3>
                        <span className="product-price" style={{ fontSize: '15px' }} className="text-gradient">₹{prod.price.toFixed(2)}</span>
                      </div>
                      <div style={{ padding: '0 16px', display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button 
                          onClick={() => handleMoveWishlistToCart(prod)}
                          className="btn-primary" 
                          style={{ flexGrow: 1, padding: '8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                          disabled={prod.stockQuantity <= 0}
                        >
                          <ShoppingCart size={12} /> Move to Cart
                        </button>
                        <button 
                          onClick={() => {
                            toggleWishlist(prod).then(() => fetchWishlist());
                          }}
                          className="btn-secondary" 
                          style={{ padding: '8px', color: 'var(--danger)' }}
                          title="Remove"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: Saved Address Book Manager */}
          {activeTab === 'addresses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Saved Addresses</h3>
                <button onClick={openAddAddressModal} className="btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                  <Plus size={13} /> Add Address
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {addresses.length === 0 ? (
                  <div className="empty-state glass-panel" style={{ gridColumn: '1 / -1', borderRadius: '16px' }}>
                    <MapPin size={36} style={{ color: 'var(--text-tertiary)' }} />
                    <h3>No Addresses Saved</h3>
                    <p>Add shipping destinations to speed up checkout.</p>
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr._id} className="address-card glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
                      <span className="address-type-badge" style={{ position: 'absolute', top: '16px', right: '16px', padding: '2px 8px', borderRadius: '99px', fontSize: '10px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-color)', fontWeight: '700' }}>
                        {addr.addressType || 'Home'}
                      </span>
                      <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} style={{ color: 'var(--accent-color)' }} /> Destination
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', minHeight: '60px' }}>
                        {addr.street},<br />
                        {addr.city}, {addr.postalCode}<br />
                        {addr.country}
                      </p>
                      
                      <div style={{ display: 'flex', gap: '12px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        <button onClick={() => openEditAddressModal(addr)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Edit size={11} /> Edit
                        </button>
                        <button onClick={() => handleDeleteAddress(addr._id)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--danger)' }}>
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: Account Profile Credentials Editor */}
          {activeTab === 'profile' && (
            <div>
              <h3>Profile Settings</h3>
              <form onSubmit={handleProfileSubmit} className="checkout-form" style={{ marginTop: '20px', maxWidth: '450px' }}>
                <div className="form-group">
                  <label htmlFor="prof-name">Full Name</label>
                  <input
                    id="prof-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="prof-email">Email Address</label>
                  <input
                    id="prof-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prof-pass">New Password (Leave blank to keep current)</label>
                  <input
                    id="prof-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prof-confpass">Confirm New Password</label>
                  <input
                    id="prof-confpass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={updatingProfile} style={{ padding: '12px', width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                  {updatingProfile ? 'Applying Profile Changes...' : 'Save Settings'}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Address CRUD Modal Dialog */}
      {showAddressModal && (
        <div className="modal-overlay open">
          <div className="modal-container" style={{ maxWidth: '450px' }}>
            <button onClick={() => setShowAddressModal(false)} className="close-modal-btn">&times;</button>
            <div style={{ padding: '32px' }}>
              <h2>{isEditAddressMode ? 'Modify Saved Address' : 'Register New Address'}</h2>
              <form onSubmit={handleAddressSubmit} className="checkout-form" style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label htmlFor="addr-type">Address Type Tag</label>
                  <select 
                    id="addr-type" 
                    value={addressType} 
                    onChange={(e) => setAddressType(e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="Home">Home Address</option>
                    <option value="Office">Office Address</option>
                    <option value="Other">Other Location</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="addr-street">Street Address</label>
                  <input
                    id="addr-street"
                    type="text"
                    placeholder="e.g. 123 Main St, Apt 4B"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="addr-city">City</label>
                    <input
                      id="addr-city"
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="addr-zip">Postal Code</label>
                    <input
                      id="addr-zip"
                      type="text"
                      placeholder="Postal Code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="addr-country">Country</label>
                  <input
                    id="addr-country"
                    type="text"
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ padding: '12px', width: '100%', justifyContent: 'center', marginTop: '16px' }}>
                  {isEditAddressMode ? 'Apply Address Changes' : 'Add Destination'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
