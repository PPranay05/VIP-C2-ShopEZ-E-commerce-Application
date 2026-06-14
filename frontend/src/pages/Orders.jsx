import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Package, Calendar, DollarSign, RefreshCw } from 'lucide-react';
import AuthContext from '../context/AuthContext';

const Orders = ({ showToast }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userInfo } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5000/api/orders/myorders');
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Failed to load your orders database.', 'danger');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userInfo) {
      navigate('/login?redirect=orders');
    } else {
      fetchOrders();
    }
  }, [userInfo]);

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '400px', flexDirection: 'column', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--accent-color)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        ></div>
        <span style={{ color: 'var(--text-secondary)' }}>Retrieving purchase history...</span>
      </div>
    );
  }

  return (
    <div className="container orders-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>My Order History</h1>
        <button
          onClick={fetchOrders}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
          title="Reload Orders"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '60px',
            borderRadius: 'var(--border-radius-lg)',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}
        >
          <Package size={48} style={{ strokeWidth: '1.2', color: 'var(--text-tertiary)', marginBottom: '16px' }} />
          <h3>No Orders Placed Yet</h3>
          <p style={{ fontSize: '14px', margin: '8px 0 20px 0' }}>
            Once you purchase premium goods, they will appear here with delivery trackers.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
            style={{ padding: '10px 24px', borderRadius: '99px', fontSize: '14px' }}
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date Placed</th>
                <th>Items Ordered</th>
                <th>Total Value</th>
                <th>Payment</th>
                <th>Delivery Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  {/* Order ID */}
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '13px' }}>
                    {order._id}
                  </td>
                  
                  {/* Date */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  
                  {/* Items Review */}
                  <td>
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '200px' }}>
                      {order.orderItems.map((item, idx) => (
                        <div
                          key={idx}
                          style={{ position: 'relative', minWidth: '40px', width: '40px', height: '40px' }}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid var(--border-color)'
                            }}
                            title={`${item.name} (Qty: ${item.qty})`}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '-4px',
                              right: '-4px',
                              backgroundColor: 'var(--bg-secondary)',
                              color: 'var(--text-primary)',
                              fontSize: '9px',
                              fontWeight: '700',
                              border: '1px solid var(--border-color)',
                              borderRadius: '50%',
                              width: '16px',
                              height: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            {item.qty}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Total price */}
                  <td style={{ fontWeight: '700' }}>
                    ₹{order.totalPrice.toFixed(2)}
                  </td>

                  {/* Payment */}
                  <td>
                    <span className="status-badge paid">
                      {order.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>

                  {/* Delivery Status */}
                  <td>
                    {order.isDelivered ? (
                      <span className="status-badge delivered">
                        Delivered
                      </span>
                    ) : (
                      <span className="status-badge pending">
                        Processing
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
