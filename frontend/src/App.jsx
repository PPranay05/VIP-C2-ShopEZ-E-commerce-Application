import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import Dashboard from './pages/Dashboard';
import CompareTray from './components/CompareTray';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

const App = () => {
  // Drawer overlays visibility state
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  // Search keyword filter state (passed from Navbar to Home)
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic light/dark theme state
  const [theme, setTheme] = useState('light');

  // Multi-toast banners state array
  const [toasts, setToasts] = useState([]);

  // Load and apply theme on startup
  useEffect(() => {
    const savedTheme = localStorage.getItem('shopez-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('shopez-theme', nextTheme);
  };

  // Add a toast notification to screen
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto delete toast after 4s
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
              position: 'relative'
            }}
          >
            {/* Header / Nav */}
            <Navbar
              toggleCart={() => setCartOpen(!cartOpen)}
              toggleWishlist={() => setWishlistOpen(!wishlistOpen)}
              theme={theme}
              toggleTheme={toggleTheme}
              onSearch={(val) => setSearchQuery(val)}
            />

            {/* Dynamic Pages */}
            <main style={{ flexGrow: 1, paddingBottom: '40px' }}>
              <Routes>
                <Route
                  path="/"
                  element={<Home searchQuery={searchQuery} showToast={showToast} />}
                />
                <Route
                  path="/product/:id"
                  element={<ProductDetail showToast={showToast} />}
                />
                <Route
                  path="/checkout"
                  element={<Checkout showToast={showToast} />}
                />
                <Route
                  path="/orders"
                  element={<Orders showToast={showToast} />}
                />
                <Route
                  path="/login"
                  element={<Login showToast={showToast} />}
                />
                <Route
                  path="/register"
                  element={<Register showToast={showToast} />}
                />
                <Route
                  path="/admin"
                  element={<AdminDashboard showToast={showToast} />}
                />
                <Route
                  path="/dashboard"
                  element={<Dashboard showToast={showToast} />}
                />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />

            {/* Slide-out Panels */}
            <CartDrawer
              isOpen={cartOpen}
              onClose={() => setCartOpen(false)}
              showToast={showToast}
            />
            
            <WishlistDrawer
              isOpen={wishlistOpen}
              onClose={() => setWishlistOpen(false)}
              showToast={showToast}
            />

            {/* Floating Compare Tray */}
            <CompareTray showToast={showToast} />

            {/* Floating Toasts container */}
            <div className="toast-container">
              {toasts.map((toast) => (
                <div key={toast.id} className={`toast ${toast.type}`}>
                  <span>{toast.message}</span>
                </div>
              ))}
            </div>
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
