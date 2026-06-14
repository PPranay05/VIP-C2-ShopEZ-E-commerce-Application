import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, CheckCircle, Package, ArrowLeft, Truck, ChevronRight, QrCode, Wallet, ShoppingBag } from 'lucide-react';
import CartContext from '../context/CartContext';
import AuthContext from '../context/AuthContext';

const Checkout = ({ showToast }) => {
  const {
    cartItems,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    couponDiscount,
    appliedCoupon,
    applyCouponCode,
    removeCouponCode,
    clearCart
  } = useContext(CartContext);
  const { userInfo } = useContext(AuthContext);
  const navigate = useNavigate();

  // Step Wizard: 'address' | 'payment' | 'review' | 'success'
  const [step, setStep] = useState('address');

  // Address Selection
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  
  // Custom manual inputs if no address selected
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');

  // Payment Options
  const [paymentMethod, setPaymentMethod] = useState('Stripe'); // 'Stripe' | 'COD' | 'UPI' | 'Wallet'
  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Coupon Code Form input
  const [couponInput, setCouponInput] = useState('');

  // Processing & Success State
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Load saved addresses on startup
  useEffect(() => {
    if (!userInfo) {
      navigate('/login?redirect=checkout');
      return;
    }
    if (cartItems.length === 0 && step !== 'success') {
      navigate('/');
      return;
    }

    const fetchAddresses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        const { data } = await axios.get('http://localhost:5000/api/auth/addresses', config);
        setSavedAddresses(data);
        if (data.length > 0) {
          setSelectedAddressId(data[0]._id);
          setStreet(data[0].street);
          setCity(data[0].city);
          setPostalCode(data[0].postalCode);
          setCountry(data[0].country);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAddresses();
  }, [userInfo, cartItems]);

  const handleAddressSelect = (addrId) => {
    setSelectedAddressId(addrId);
    if (addrId === 'new') {
      setStreet('');
      setCity('');
      setPostalCode('');
      setCountry('');
    } else {
      const addr = savedAddresses.find(a => a._id === addrId);
      if (addr) {
        setStreet(addr.street);
        setCity(addr.city);
        setPostalCode(addr.postalCode);
        setCountry(addr.country);
      }
    }
  };

  const handleAddressNext = (e) => {
    e.preventDefault();
    if (!street || !city || !postalCode || !country) {
      showToast('Please specify a shipping destination.', 'warning');
      return;
    }
    setStep('payment');
  };

  const handlePaymentNext = (e) => {
    e.preventDefault();
    if (paymentMethod === 'Stripe') {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
        showToast('Please enter a valid 16-digit credit card number.', 'warning');
        return;
      }
      if (!expDate || !expDate.includes('/')) {
        showToast('Please enter card expiry date in MM/YY format.', 'warning');
        return;
      }
      if (!cvv || cvv.length !== 3) {
        showToast('Please enter a valid 3-digit CVV number.', 'warning');
        return;
      }
    }
    setStep('review');
  };

  const handleCouponApply = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = await applyCouponCode(couponInput.trim());
    if (res.success) {
      showToast(res.message, 'success');
      setCouponInput('');
    } else {
      showToast(res.message, 'danger');
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      let paymentResult = { id: `ch_mock_${Date.now()}`, status: 'succeeded' };

      // 1. Stripe payment intent
      if (paymentMethod === 'Stripe') {
        const { data } = await axios.post(
          'http://localhost:5000/api/payments/intent',
          { amount: totalPrice },
          config
        );
        paymentResult = { id: data.paymentId, status: data.status };
      }

      // 2. Format items for API schema
      const orderItems = cartItems.map(item => ({
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: item.price,
        size: item.size || '',
        color: item.color || '',
        storage: item.storage || '',
        weight: item.weight || '',
        product: item.product
      }));

      // 3. Post order
      const { data } = await axios.post(
        'http://localhost:5000/api/orders',
        {
          orderItems,
          shippingAddress: { street, city, postalCode, country },
          paymentMethod,
          itemsPrice,
          taxPrice,
          shippingPrice,
          totalPrice,
          paymentResult,
          couponCode: appliedCoupon?.code || '',
          couponDiscount
        },
        config
      );

      // Save order to profile addresses list if new
      if (selectedAddressId === 'new') {
        try {
          await axios.post('http://localhost:5000/api/auth/addresses', {
            addressType: 'Home', street, city, postalCode, country
          }, config);
        } catch (addrErr) {}
      }

      setCompletedOrder(data);
      setStep('success');
      clearCart();
      showToast('Order placed successfully!', 'success');
    } catch (error) {
      console.error('Checkout error:', error);
      showToast(error.response?.data?.message || 'Failed to place order.', 'danger');
    }
    setIsProcessing(false);
  };

  // Card input formatters
  const handleCardNumberChange = (e) => {
    const input = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = input.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpDateChange = (e) => {
    const input = e.target.value.replace(/\D/g, '').substring(0, 4);
    let formatted = input;
    if (input.length > 2) {
      formatted = `${input.substring(0, 2)}/${input.substring(2)}`;
    }
    setExpDate(formatted);
  };

  // Success Step screen
  if (step === 'success' && completedOrder) {
    return (
      <div className="container flex-center" style={{ minHeight: 'calc(100vh - 160px)', paddingUp: '40px' }}>
        <div className="success-card glass-panel" style={{ width: '100%', maxWidth: '500px', textAlign: 'center', padding: '40px', borderRadius: '24px' }}>
          <div className="success-icon flex-center" style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', margin: '0 auto 24px auto' }}>
            <CheckCircle size={40} />
          </div>
          <h2 className="success-title">Order Confirmed!</h2>
          <p className="success-desc" style={{ color: 'var(--text-secondary)', margin: '12px 0 24px 0', fontSize: '14px' }}>
            Your simulated transaction has been processed. Order #{completedOrder._id} is now processing.
          </p>

          <div
            style={{
              textAlign: 'left',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '32px',
              border: '1px solid var(--border-color)',
              fontSize: '13px'
            }}
          >
            <h4 style={{ marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
              Receipt Details
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Order ID:</span>
              <span style={{ fontWeight: '600' }}>{completedOrder._id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Payment Mode:</span>
              <span style={{ fontWeight: '600' }}>{completedOrder.paymentMethod}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ship To:</span>
              <span style={{ fontWeight: '600' }}>
                {completedOrder.shippingAddress.street}, {completedOrder.shippingAddress.city}
              </span>
            </div>
            {completedOrder.couponDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--success)' }}>
                <span>Coupon Discount:</span>
                <span>-₹{completedOrder.couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '12px',
                borderTop: '1px dashed var(--border-color)',
                paddingTop: '12px',
                fontWeight: '700',
                fontSize: '15px'
              }}
            >
              <span>Amount Paid:</span>
              <span className="text-gradient">₹{completedOrder.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link to="/dashboard" className="btn-primary" style={{ padding: '12px 24px' }}>
              Track My Order
            </Link>
            <Link to="/" className="btn-secondary" style={{ padding: '12px 24px' }}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container checkout-page">
      <Link to="/" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px', marginBottom: '28px' }}>
        <ArrowLeft size={14} /> Back to Catalog
      </Link>

      <h1 style={{ marginBottom: '32px' }}>Complete Purchase Checkout</h1>

      {/* Progress Steps Header */}
      <div className="checkout-steps flex-center" style={{ gap: '16px', marginBottom: '40px' }}>
        <span className={`step-node ${step === 'address' ? 'active' : ''}`}>1. Shipping Address</span>
        <ChevronRight size={16} style={{ opacity: 0.5 }} />
        <span className={`step-node ${step === 'payment' ? 'active' : ''}`}>2. Payment Method</span>
        <ChevronRight size={16} style={{ opacity: 0.5 }} />
        <span className={`step-node ${step === 'review' ? 'active' : ''}`}>3. Final Review</span>
      </div>

      <div className="checkout-layout">
        {/* Step Forms */}
        <div className="checkout-form-panel">
          
          {/* STEP 1: Address selection */}
          {step === 'address' && (
            <form onSubmit={handleAddressNext}>
              <h3 className="checkout-section-title">
                <Truck size={18} />
                <span>Shipping Address</span>
              </h3>
              
              {savedAddresses.length > 0 && (
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="saved-addr-select">Choose Saved Destination</label>
                  <select
                    id="saved-addr-select"
                    value={selectedAddressId}
                    onChange={(e) => handleAddressSelect(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px' }}
                  >
                    {savedAddresses.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.addressType || 'Home'} - {a.street}, {a.city}
                      </option>
                    ))}
                    <option value="new">+ Ship to a new address</option>
                  </select>
                </div>
              )}

              {(!savedAddresses.length || selectedAddressId === 'new') && (
                <div className="checkout-form flex-column" style={{ gap: '14px' }}>
                  <div className="form-group">
                    <label htmlFor="street-in">Street Address</label>
                    <input
                      id="street-in"
                      type="text"
                      placeholder="e.g. 123 Pine St, Apt 4"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="city-in">City</label>
                      <input
                        id="city-in"
                        type="text"
                        placeholder="City"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="zip-in">Postal Code</label>
                      <input
                        id="zip-in"
                        type="text"
                        placeholder="Zip code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="country-in">Country</label>
                    <input
                      id="country-in"
                      type="text"
                      placeholder="Country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '14px', marginTop: '24px', justifyContent: 'center' }}>
                Proceed to Payment Options
              </button>
            </form>
          )}

          {/* STEP 2: Payment options */}
          {step === 'payment' && (
            <form onSubmit={handlePaymentNext}>
              <h3 className="checkout-section-title">
                <CreditCard size={18} />
                <span>Select Payment Simulation</span>
              </h3>

              <div className="payment-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                {[
                  { id: 'Stripe', label: 'Credit Card', icon: <CreditCard size={18} /> },
                  { id: 'UPI', label: 'UPI Sim', icon: <QrCode size={18} /> },
                  { id: 'Wallet', label: 'Wallet Sim', icon: <Wallet size={18} /> },
                  { id: 'Cash on Delivery', label: 'COD (Cash)', icon: <Truck size={18} /> }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`payment-opt-card glass-panel ${paymentMethod === opt.id ? 'active' : ''}`}
                    onClick={() => setPaymentMethod(opt.id)}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      border: `2px solid ${paymentMethod === opt.id ? 'var(--accent-color)' : 'var(--border-color)'}`
                    }}
                  >
                    {opt.icon}
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>{opt.label}</span>
                  </button>
                ))}
              </div>

              {/* Specific payment input templates */}
              {paymentMethod === 'Stripe' && (
                <div className="checkout-form flex-column" style={{ gap: '14px' }}>
                  <div className="form-group">
                    <label htmlFor="card-no">Card Number</label>
                    <input
                      id="card-no"
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="card-exp">Expiry (MM/YY)</label>
                      <input
                        id="card-exp"
                        type="text"
                        placeholder="MM/YY"
                        value={expDate}
                        onChange={handleExpDateChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="card-cvv">CVV</label>
                      <input
                        id="card-cvv"
                        type="password"
                        placeholder="000"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0,3))}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'UPI' && (
                <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
                  <QrCode size={120} style={{ margin: '0 auto 12px auto' }} />
                  <h4>Simulated Scan QR Code Code</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>A dynamic simulated QR scanner checkout intent will compile upon submitting order.</p>
                </div>
              )}

              {paymentMethod === 'Wallet' && (
                <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
                  <Wallet size={36} style={{ color: 'var(--accent-color)', marginBottom: '8px' }} />
                  <h4>Wallet Checkout Selected</h4>
                  <p style={{ fontSize: '13px' }}>Current Balance: <strong>₹{(userInfo?.walletBalance || 0).toFixed(2)}</strong></p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Order Total of ₹{totalPrice.toFixed(2)} will be debited instantly from wallet balance.</p>
                </div>
              )}

              {paymentMethod === 'Cash on Delivery' && (
                <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed var(--border-color)', borderRadius: '16px' }}>
                  <Truck size={36} style={{ color: 'var(--success)', marginBottom: '8px' }} />
                  <h4>Cash On Delivery (COD)</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Pay cash directly to delivery executive once order reaches your shipping address.</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setStep('address')} className="btn-secondary" style={{ width: '30%', padding: '14px', justifyContent: 'center' }}>
                  Back
                </button>
                <button type="submit" className="btn-primary" style={{ width: '70%', padding: '14px', justifyContent: 'center' }}>
                  Continue to Review & Coupon
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Final Review */}
          {step === 'review' && (
            <div>
              <h3 className="checkout-section-title">
                <ShoppingBag size={18} />
                <span>Confirm Purchase Details</span>
              </h3>

              <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', fontSize: '13px', marginBottom: '24px' }}>
                <h4 style={{ marginBottom: '8px' }}>Shipping Destination</h4>
                <p style={{ color: 'var(--text-secondary)' }}>{street}, {city}, {postalCode}, {country}</p>
                
                <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Payment Mode</h4>
                <p style={{ color: 'var(--text-secondary)' }}>{paymentMethod} simulation</p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setStep('payment')} className="btn-secondary" style={{ width: '30%', padding: '14px', justifyContent: 'center' }}>
                  Back
                </button>
                <button 
                  onClick={handlePlaceOrder}
                  className="btn-primary" 
                  disabled={isProcessing}
                  style={{ width: '70%', padding: '14px', justifyContent: 'center' }}
                >
                  {isProcessing ? 'Processing Transaction...' : `Confirm & Pay $${totalPrice.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Order review side list (Right panel) */}
        <aside className="checkout-summary-panel glass-panel" style={{ borderRadius: 'var(--border-radius-md)' }}>
          <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>Items Summary</h3>

          <div className="checkout-items-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {cartItems.map((item) => (
              <div key={item.cartId} className="checkout-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  />
                  <div>
                    <span className="checkout-item-name" style={{ fontSize: '13px' }} title={item.name}>
                      {item.name}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Qty: {item.qty} &times; ₹{item.price.toFixed(2)}
                      {item.variantString && ` | ${item.variantString}`}
                    </div>
                  </div>
                </div>
                <span className="checkout-item-price" style={{ fontSize: '13px', fontWeight: '600' }}>₹{(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Coupon Entry Form */}
          {step !== 'success' && (
            <form onSubmit={handleCouponApply} className="coupon-apply-form" style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
              <input
                type="text"
                placeholder="Apply coupon code..."
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                style={{ flexGrow: 1, padding: '8px 12px', fontSize: '12px', textTransform: 'uppercase' }}
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <button type="button" onClick={removeCouponCode} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '12px', color: 'var(--danger)' }}>
                  Remove
                </button>
              ) : (
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
                  Apply
                </button>
              )}
            </form>
          )}

          {appliedCoupon && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--success)', fontWeight: '600' }}>
              <span>Applied Coupon: {appliedCoupon.code}</span>
              <span>-₹{couponDiscount.toFixed(2)} ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : 'flat'} off)</span>
            </div>
          )}

          <div className="cart-summary" style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div className="summary-row">
              <span>Items Price</span>
              <span>₹{itemsPrice.toFixed(2)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="summary-row" style={{ color: 'var(--success)' }}>
                <span>Coupon Discount</span>
                <span>-₹{couponDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping Fee</span>
              <span>{shippingPrice === 0 ? 'FREE' : `₹${shippingPrice.toFixed(2)}`}</span>
            </div>
            <div className="summary-row">
              <span>Sales Tax (8%)</span>
              <span>₹{taxPrice.toFixed(2)}</span>
            </div>
            <div className="checkout-total-row">
              <span>Total Due</span>
              <span className="text-gradient">₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
