import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { BarChart3, Plus, Edit, Trash2, Check, RefreshCw, Layers, DollarSign, ShoppingBag, Users, Ticket, AlertTriangle, Eye, ShieldAlert } from 'lucide-react';
import AuthContext from '../context/AuthContext';

// Register Chart.js elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = ({ showToast }) => {
  const { userInfo } = useContext(AuthContext);
  const navigate = useNavigate();

  // Tab State: 'analytics' | 'inventory' | 'orders' | 'customers' | 'coupons'
  const [activeTab, setActiveTab] = useState('analytics');

  // Database Data States
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Statistics
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0
  });

  // Product CRUD Form State
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [stockQuantity, setStockQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [brand, setBrand] = useState('');
  const [discountType, setDiscountType] = useState('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [isBOGO, setIsBOGO] = useState(false);
  const [dealType, setDealType] = useState('none');

  // Coupon Form State
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [isEditCouponMode, setIsEditCouponMode] = useState(false);
  const [currentCouponId, setCurrentCouponId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscType, setCouponDiscType] = useState('percentage');
  const [couponDiscValue, setCouponDiscValue] = useState('');
  const [couponExpiry, setCouponExpiry] = useState('');
  const [couponMinPurchase, setCouponMinPurchase] = useState('');
  const [couponActive, setCouponActive] = useState(true);

  // Redirect if user is not admin
  useEffect(() => {
    if (!userInfo || userInfo.role !== 'admin') {
      showToast('Access Denied. Administrator role required.', 'danger');
      navigate('/');
    } else {
      fetchAdminData();
    }
  }, [userInfo]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      // Fetch all collections in parallel
      const [productsRes, ordersRes, customersRes, couponsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/products', config),
        axios.get('http://localhost:5000/api/orders', config),
        axios.get('http://localhost:5000/api/auth/customers', config),
        axios.get('http://localhost:5000/api/coupons', config)
      ]);

      const prodsData = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.products || [];
      setProducts(prodsData);
      setOrders(ordersRes.data);
      setCustomers(customersRes.data);
      setCoupons(couponsRes.data);

      // Compute Statistics
      const sales = ordersRes.data.reduce((acc, order) => acc + (order.isPaid ? order.totalPrice : 0), 0);
      setStats({
        totalSales: sales,
        totalOrders: ordersRes.data.length,
        totalProducts: prodsData.length,
        totalCustomers: customersRes.data.length
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      showToast('Error loading server databases.', 'danger');
    }
    setLoading(false);
  };

  // Mark Order Status Tracking Stages
  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { status: nextStatus }, config);
      showToast(`Order status updated to: ${nextStatus}`, 'success');
      fetchAdminData();
    } catch (error) {
      showToast('Failed to update order status.', 'danger');
    }
  };

  // Block/Unblock Customer
  const handleToggleBlockCustomer = async (customerId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.put(`http://localhost:5000/api/auth/customers/${customerId}/block`, {}, config);
      showToast(data.message, 'success');
      fetchAdminData();
    } catch (error) {
      showToast('Failed to toggle user block status.', 'danger');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to permanently delete this product?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`http://localhost:5000/api/products/${productId}`, config);
        showToast('Product successfully removed from database.', 'success');
        fetchAdminData();
      } catch (error) {
        showToast('Failed to remove product.', 'danger');
      }
    }
  };

  // Create or Update Product Submit
  const handleProductSubmit = async (e) => {
    e.preventDefault();

    if (!name || !price || !description || !stockQuantity || !brand) {
      showToast('Please fill out all product form fields.', 'warning');
      return;
    }

    const payload = {
      name,
      price: Number(price),
      originalPrice: Number(originalPrice || price),
      description,
      category,
      stockQuantity: Number(stockQuantity),
      image: imageUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
      brand,
      discountType,
      discountValue: Number(discountValue || 0),
      isBOGO,
      dealType
    };

    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

    try {
      if (isEditMode) {
        await axios.put(`http://localhost:5000/api/products/${currentProductId}`, payload, config);
        showToast(`Product "${name}" updated successfully!`, 'success');
      } else {
        await axios.post('http://localhost:5000/api/products', payload, config);
        showToast(`Product "${name}" added to catalog!`, 'success');
      }
      setShowProductModal(false);
      resetProductForm();
      fetchAdminData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Action failed.', 'danger');
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    resetProductForm();
    setShowProductModal(true);
  };

  const openEditModal = (prod) => {
    setIsEditMode(true);
    setCurrentProductId(prod._id);
    setName(prod.name);
    setPrice(prod.price);
    setOriginalPrice(prod.originalPrice || prod.price);
    setDescription(prod.description);
    setCategory(prod.category);
    setStockQuantity(prod.stockQuantity);
    setImageUrl(prod.images[0] || '');
    setBrand(prod.brand || 'Generic');
    setDiscountType(prod.discountType || 'none');
    setDiscountValue(prod.discountValue || 0);
    setIsBOGO(prod.isBOGO || false);
    setDealType(prod.dealType || 'none');
    setShowProductModal(true);
  };

  const resetProductForm = () => {
    setCurrentProductId(null);
    setName('');
    setPrice('');
    setOriginalPrice('');
    setDescription('');
    setCategory('Electronics');
    setStockQuantity('');
    setImageUrl('');
    setBrand('');
    setDiscountType('none');
    setDiscountValue(0);
    setIsBOGO(false);
    setDealType('none');
  };

  // Coupon CRUD Handlers
  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    if (!couponCode || !couponDiscValue || !couponExpiry) {
      showToast('Please fill out all coupon fields.', 'warning');
      return;
    }

    const payload = {
      code: couponCode,
      discountType: couponDiscType,
      discountValue: Number(couponDiscValue),
      expiryDate: couponExpiry,
      minPurchase: Number(couponMinPurchase || 0),
      active: couponActive
    };

    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

    try {
      if (isEditCouponMode) {
        await axios.put(`http://localhost:5000/api/coupons/${currentCouponId}`, payload, config);
        showToast(`Coupon "${couponCode.toUpperCase()}" updated.`, 'success');
      } else {
        await axios.post('http://localhost:5000/api/coupons', payload, config);
        showToast(`Coupon "${couponCode.toUpperCase()}" created.`, 'success');
      }
      setShowCouponModal(false);
      resetCouponForm();
      fetchAdminData();
    } catch (error) {
      showToast(error.response?.data?.message || 'Coupon operation failed.', 'danger');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (window.confirm('Delete this coupon permanently?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`http://localhost:5000/api/coupons/${couponId}`, config);
        showToast('Coupon removed successfully.', 'success');
        fetchAdminData();
      } catch (err) {
        showToast('Failed to delete coupon.', 'danger');
      }
    }
  };

  const openAddCouponModal = () => {
    setIsEditCouponMode(false);
    resetCouponForm();
    setShowCouponModal(true);
  };

  const openEditCouponModal = (coup) => {
    setIsEditCouponMode(true);
    setCurrentCouponId(coup._id);
    setCouponCode(coup.code);
    setCouponDiscType(coup.discountType || 'percentage');
    setCouponDiscValue(coup.discountValue);
    setCouponExpiry(coup.expiryDate ? new Date(coup.expiryDate).toISOString().substring(0, 10) : '');
    setCouponMinPurchase(coup.minPurchase || 0);
    setCouponActive(coup.active !== undefined ? coup.active : true);
    setShowCouponModal(true);
  };

  const resetCouponForm = () => {
    setCurrentCouponId(null);
    setCouponCode('');
    setCouponDiscType('percentage');
    setCouponDiscValue('');
    setCouponExpiry('');
    setCouponMinPurchase('');
    setCouponActive(true);
  };

  // --- Chart.js Configurations ---
  const salesChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Revenue (₹)',
        data: [
          stats.totalSales * 0.1,
          stats.totalSales * 0.15,
          stats.totalSales * 0.25,
          stats.totalSales * 0.18,
          stats.totalSales * 0.32,
          stats.totalSales, // Peak
          0, 0, 0, 0, 0, 0
        ],
        fill: false,
        borderColor: '#6366f1',
        tension: 0.3,
        pointBackgroundColor: '#818cf8',
        pointHoverRadius: 8,
      },
    ],
  };

  const categoriesCount = products.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const categoriesChartData = {
    labels: Object.keys(categoriesCount),
    datasets: [
      {
        label: 'SKUs by Category',
        data: Object.values(categoriesCount),
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(244, 63, 94, 0.7)',
          'rgba(20, 184, 166, 0.7)',
          'rgba(100, 116, 139, 0.7)',
          'rgba(101, 163, 13, 0.7)'
        ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#818cf8',
          font: { family: 'Inter', weight: '500' }
        }
      }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: 'var(--text-secondary)' }
      },
      x: {
        grid: { display: false },
        ticks: { color: 'var(--text-secondary)' }
      }
    }
  };

  // Filter low stock and out-of-stock products
  const lowStockProducts = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5);
  const outOfStockProducts = products.filter(p => p.stockQuantity <= 0);

  return (
    <div className="container admin-page" style={{ paddingTop: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Administrator Management Console</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Curate inventories, administer users, deploy coupon marketing, and track sales revenue analytics.
          </p>
        </div>
        <button
          onClick={fetchAdminData}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px' }}
        >
          <RefreshCw size={13} /> Sync Data
        </button>
      </div>

      <div className="admin-layout" style={{ marginTop: '32px' }}>
        {/* Sidebar Tabs */}
        <aside className="admin-menu">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`admin-menu-item ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            <BarChart3 size={16} /> Analytics Overview
          </button>
          
          <button
            onClick={() => setActiveTab('inventory')}
            className={`admin-menu-item ${activeTab === 'inventory' ? 'active' : ''}`}
          >
            <Layers size={16} /> Inventory Catalog
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`admin-menu-item ${activeTab === 'orders' ? 'active' : ''}`}
          >
            <ShoppingBag size={16} /> Customers Orders
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`admin-menu-item ${activeTab === 'customers' ? 'active' : ''}`}
          >
            <Users size={16} /> Customers Database
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`admin-menu-item ${activeTab === 'coupons' ? 'active' : ''}`}
          >
            <Ticket size={16} /> Marketing & Coupons
          </button>
        </aside>

        {/* Content Panels */}
        <main className="admin-content-panel">
          
          {/* TAB: Analytics */}
          {activeTab === 'analytics' && (
            <div>
              {/* Stats Cards */}
              <div className="admin-stats-grid">
                <div className="stat-card glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                  <div className="stat-label" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Total Sales Revenue</span>
                    <DollarSign size={16} style={{ color: 'var(--success)' }} />
                  </div>
                  <div className="stat-value text-gradient" style={{ fontSize: '28px', marginTop: '8px' }}>₹{stats.totalSales.toFixed(2)}</div>
                </div>

                <div className="stat-card glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                  <div className="stat-label" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Orders Placed</span>
                    <ShoppingBag size={16} style={{ color: 'var(--accent-color)' }} />
                  </div>
                  <div className="stat-value" style={{ fontSize: '28px', marginTop: '8px' }}>{stats.totalOrders}</div>
                </div>

                <div className="stat-card glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                  <div className="stat-label" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Unique SKUs</span>
                    <Layers size={16} style={{ color: 'var(--warning)' }} />
                  </div>
                  <div className="stat-value" style={{ fontSize: '28px', marginTop: '8px' }}>{stats.totalProducts}</div>
                </div>

                <div className="stat-card glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
                  <div className="stat-label" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Registered Customers</span>
                    <Users size={16} style={{ color: 'var(--accent-color)' }} />
                  </div>
                  <div className="stat-value" style={{ fontSize: '28px', marginTop: '8px' }}>{stats.totalCustomers}</div>
                </div>
              </div>

              {/* Alert panels for low stock/out of stock */}
              {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {outOfStockProducts.length > 0 && (
                    <div className="alert-banner danger-banner flex-center" style={{ gap: '10px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(244, 63, 94, 0.15)', color: 'var(--danger)', justifyContent: 'flex-start' }}>
                      <AlertTriangle size={18} />
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>
                        Alert: {outOfStockProducts.length} product(s) are completely out of stock! Go to Inventory Catalog to restock them.
                      </span>
                    </div>
                  )}
                  {lowStockProducts.length > 0 && (
                    <div className="alert-banner warning-banner flex-center" style={{ gap: '10px', padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', justifyContent: 'flex-start' }}>
                      <AlertTriangle size={18} />
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>
                        Warning: {lowStockProducts.length} product(s) are running critically low on stock (&le; 5 units).
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Data Visualization Charts */}
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginTop: '40px' }}>
                Store Sales Trends
              </h3>
              
              <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '20px' }}>
                {/* Line Chart */}
                <div className="chart-wrapper glass-panel" style={{ height: '280px', padding: '20px', borderRadius: '16px' }}>
                  <h5 style={{ marginBottom: '12px' }}>Monthly Sales Revenue</h5>
                  <div style={{ height: '200px' }}>
                    <Line data={salesChartData} options={chartOptions} />
                  </div>
                </div>
                
                {/* Bar Chart */}
                <div className="chart-wrapper glass-panel" style={{ height: '280px', padding: '20px', borderRadius: '16px' }}>
                  <h5 style={{ marginBottom: '12px' }}>Product SKU Categories Distribution</h5>
                  <div style={{ height: '200px' }}>
                    <Bar data={categoriesChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Inventory Catalog */}
          {activeTab === 'inventory' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Inventory Catalog ({products.length} Products)</h3>
                <button
                  onClick={openAddModal}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
                >
                  <Plus size={14} /> Add Product SKU
                </button>
              </div>

              {/* Products Table */}
              <div className="orders-table-wrapper" style={{ margin: 0 }}>
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Discounts</th>
                      <th>Stock Quantity</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => (
                      <tr key={prod._id}>
                        <td>
                          <img
                            src={prod.images[0] || '/images/placeholder.jpg'}
                            alt={prod.name}
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          <div>{prod.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Brand: {prod.brand}</div>
                        </td>
                        <td>{prod.category}</td>
                        <td style={{ fontWeight: '600' }}>
                          ₹{prod.price.toFixed(2)}
                          {prod.discountType !== 'none' && (
                            <div style={{ textDecoration: 'line-through', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                              ₹{prod.originalPrice.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td>
                          {prod.discountType !== 'none' ? (
                            <span className="status-badge delivered" style={{ fontSize: '11px' }}>
                              -{prod.discountValue}%
                            </span>
                          ) : prod.isBOGO ? (
                            <span className="status-badge paid" style={{ fontSize: '11px' }}>
                              BOGO
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              color: prod.stockQuantity <= 0 ? 'var(--danger)' : prod.stockQuantity <= 5 ? 'var(--warning)' : 'var(--text-primary)',
                              fontWeight: '700'
                            }}
                          >
                            {prod.stockQuantity}
                          </span>
                          {prod.stockQuantity <= 5 && <AlertTriangle size={12} color="var(--warning)" style={{ marginLeft: '4px' }} />}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => openEditModal(prod)}
                              className="wishlist-to-cart-btn"
                              style={{ color: 'var(--accent-color)' }}
                              title="Edit"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod._id)}
                              className="wishlist-to-cart-btn"
                              style={{ color: 'var(--danger)' }}
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Orders Fulfillments */}
          {activeTab === 'orders' && (
            <div>
              <h3>Customers Orders Fulfilment</h3>
              
              <div className="orders-table-wrapper" style={{ marginTop: '20px' }}>
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Total Value</th>
                      <th>Payment</th>
                      <th>Fulfillment Timeline</th>
                      <th style={{ textAlign: 'center' }}>Update Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                          No orders placed in system.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order._id}>
                          <td style={{ fontWeight: '600', fontSize: '12px' }}>{order._id}</td>
                          <td>{order.user?.name || 'Guest User'}</td>
                          <td style={{ fontWeight: '600' }} className="text-gradient">₹{order.totalPrice.toFixed(2)}</td>
                          <td>
                            <span className={`status-badge ${order.isPaid ? 'paid' : 'pending'}`}>
                              {order.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${order.status === 'Delivered' ? 'delivered' : 'pending'}`}>
                              {order.status || 'Processing'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {order.status !== 'Delivered' ? (
                              <select
                                value={order.status || 'Processing'}
                                onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value)}
                                style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px' }}
                              >
                                <option value="Processing">Processing</option>
                                <option value="Packed">Packed</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Out for Delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered</option>
                              </select>
                            ) : (
                              <span style={{ color: 'var(--success)', fontSize: '12px', fontWeight: '600' }}>Fulfillment Completed</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Customers Manager */}
          {activeTab === 'customers' && (
            <div>
              <h3>Customers Administration Database</h3>
              <div className="orders-table-wrapper" style={{ marginTop: '20px' }}>
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email Address</th>
                      <th>Role</th>
                      <th>Orders Count</th>
                      <th>Wallet Balance</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c._id}>
                        <td style={{ fontWeight: '600' }}>{c.name}</td>
                        <td>{c.email}</td>
                        <td>{c.role}</td>
                        <td>{c.orderCount || 0} Orders</td>
                        <td style={{ fontWeight: '600' }}>₹{(c.walletBalance || 0.00).toFixed(2)}</td>
                        <td>
                          <span className={`status-badge ${c.isBlocked ? 'pending' : 'delivered'}`}>
                            {c.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {c.role !== 'admin' ? (
                            <button
                              onClick={() => handleToggleBlockCustomer(c._id)}
                              className="btn-secondary"
                              style={{
                                padding: '4px 12px',
                                fontSize: '11px',
                                color: c.isBlocked ? 'var(--success)' : 'var(--danger)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {c.isBlocked ? 'Unblock' : 'Block User'}
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Admin Protected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: Coupons Manager */}
          {activeTab === 'coupons' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3>Coupons Promotion Manager</h3>
                <button
                  onClick={openAddCouponModal}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '13px' }}
                >
                  <Plus size={14} /> Create Coupon Code
                </button>
              </div>

              <div className="orders-table-wrapper" style={{ margin: 0 }}>
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Coupon Code</th>
                      <th>Discount Type</th>
                      <th>Value</th>
                      <th>Min Purchase</th>
                      <th>Expiry Date</th>
                      <th>Active</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map((c) => (
                      <tr key={c._id}>
                        <td style={{ fontWeight: '700', color: 'var(--accent-color)' }}>{c.code}</td>
                        <td style={{ textTransform: 'capitalize' }}>{c.discountType}</td>
                        <td style={{ fontWeight: '600' }}>
                          {c.discountType === 'percentage' ? `${c.discountValue}%` : `$${c.discountValue.toFixed(2)}`}
                        </td>
                        <td>₹{c.minPurchase.toFixed(2)}</td>
                        <td>{new Date(c.expiryDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${c.active ? 'delivered' : 'pending'}`}>
                            {c.active ? 'Active' : 'Expired/Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => openEditCouponModal(c)}
                              className="wishlist-to-cart-btn"
                              style={{ color: 'var(--accent-color)' }}
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteCoupon(c._id)}
                              className="wishlist-to-cart-btn"
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CRUD Product Modal Overlay */}
      {showProductModal && (
        <div className="modal-overlay open">
          <div className="modal-container" style={{ maxWidth: '500px' }}>
            <button
              onClick={() => setShowProductModal(false)}
              className="close-modal-btn"
            >
              &times;
            </button>
            <div style={{ padding: '32px' }}>
              <h2 style={{ marginBottom: '24px' }}>
                {isEditMode ? 'Modify Catalog SKU' : 'Add New Catalog SKU'}
              </h2>
              
              <form onSubmit={handleProductSubmit} className="checkout-form">
                <div className="form-group">
                  <label htmlFor="prod-name">Product Name</label>
                  <input
                    id="prod-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="prod-brand">Brand</label>
                    <input
                      id="prod-brand"
                      type="text"
                      placeholder="e.g. Sony, Nike"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-cat">Category</label>
                    <select
                      id="prod-cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Footwear">Footwear</option>
                      <option value="Watches">Watches</option>
                      <option value="Home Appliances">Home Appliances</option>
                      <option value="Sports">Sports</option>
                      <option value="Beauty">Beauty</option>
                      <option value="Grocery">Grocery</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Books">Books</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="prod-price">Sale Price (₹)</label>
                    <input
                      id="prod-price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-origprice">MSRP Original Price (₹)</label>
                    <input
                      id="prod-origprice"
                      type="number"
                      step="0.01"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="prod-stock">Stock Level</label>
                    <input
                      id="prod-stock"
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-deal">Deal Tag</label>
                    <select
                      id="prod-deal"
                      value={dealType}
                      onChange={(e) => setDealType(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="none">none</option>
                      <option value="Today's Deal">Today's Deal</option>
                      <option value="Best Deal">Best Deal</option>
                      <option value="Mega Sale">Mega Sale</option>
                      <option value="Weekend Offer">Weekend Offer</option>
                      <option value="Clearance Sale">Clearance Sale</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="prod-disctype">Discount Type</label>
                    <select
                      id="prod-disctype"
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="none">none</option>
                      <option value="percentage">percentage</option>
                      <option value="flat">flat</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="prod-discval">Discount Value</label>
                    <input
                      id="prod-discval"
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      disabled={discountType === 'none'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="prod-img">Image URL</label>
                  <input
                    id="prod-img"
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="prod-desc">Description</label>
                  <textarea
                    id="prod-desc"
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    style={{ width: '100%', resize: 'none' }}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: '16px' }}
                >
                  {isEditMode ? 'Apply SKU Changes' : 'Publish SKU'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Coupon Modal Overlay */}
      {showCouponModal && (
        <div className="modal-overlay open">
          <div className="modal-container" style={{ maxWidth: '450px' }}>
            <button
              onClick={() => setShowCouponModal(false)}
              className="close-modal-btn"
            >
              &times;
            </button>
            <div style={{ padding: '32px' }}>
              <h2>
                {isEditCouponMode ? 'Modify Coupon details' : 'Create Promotion Coupon'}
              </h2>
              
              <form onSubmit={handleCouponSubmit} className="checkout-form" style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label htmlFor="coup-code">Coupon Code (Uppercase)</label>
                  <input
                    id="coup-code"
                    type="text"
                    placeholder="e.g. EXTRA20"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    required
                    disabled={isEditCouponMode}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="coup-disctype">Type</label>
                    <select
                      id="coup-disctype"
                      value={couponDiscType}
                      onChange={(e) => setCouponDiscType(e.target.value)}
                      style={{ width: '100%' }}
                    >
                      <option value="percentage">Percentage Off (%)</option>
                      <option value="flat">Flat Cash Off (₹)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="coup-discval">Value</label>
                    <input
                      id="coup-discval"
                      type="number"
                      placeholder="e.g. 15"
                      value={couponDiscValue}
                      onChange={(e) => setCouponDiscValue(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="coup-min">Min Purchase (₹)</label>
                    <input
                      id="coup-min"
                      type="number"
                      placeholder="0"
                      value={couponMinPurchase}
                      onChange={(e) => setCouponMinPurchase(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="coup-exp">Expiry Date</label>
                    <input
                      id="coup-exp"
                      type="date"
                      value={couponExpiry}
                      onChange={(e) => setCouponExpiry(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    id="coup-active"
                    type="checkbox"
                    checked={couponActive}
                    onChange={(e) => setCouponActive(e.target.checked)}
                  />
                  <label htmlFor="coup-active">Mark Active / Redeemable</label>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', justifyContent: 'center', marginTop: '16px' }}
                >
                  {isEditCouponMode ? 'Update Coupon' : 'Deploy Coupon Code'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
