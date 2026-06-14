import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ShoppingCart, Heart, Sun, Moon, User, LogOut, Settings, Search, History, ChevronDown } from 'lucide-react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import CartContext from '../context/CartContext';

const Navbar = ({ toggleCart, toggleWishlist, theme, toggleTheme, onSearch }) => {
  const { userInfo, logout } = useContext(AuthContext);
  const { cartItems, wishlist } = useContext(CartContext);
  
  const [searchVal, setSearchVal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('shopez-recent-searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch search autocomplete suggestions
  useEffect(() => {
    if (searchVal.trim().length > 1) {
      const fetchSuggestions = async () => {
        try {
          const { data } = await axios.get(`http://localhost:5000/api/products?keyword=${searchVal}&limit=5`);
          // Our wrapper handles limits, returning array directly
          setSuggestions(Array.isArray(data) ? data : data.products || []);
        } catch (error) {
          console.error(error);
        }
      };
      const delayDebounce = setTimeout(fetchSuggestions, 200);
      return () => clearTimeout(delayDebounce);
    } else {
      setSuggestions([]);
    }
  }, [searchVal]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (!searchVal.trim()) return;

    // Save to search history
    const cleanSearch = searchVal.trim();
    const updatedHistory = [cleanSearch, ...recentSearches.filter(q => q !== cleanSearch)].slice(0, 5);
    setRecentSearches(updatedHistory);
    localStorage.setItem('shopez-recent-searches', JSON.stringify(updatedHistory));

    setShowSuggestions(false);
    if (onSearch) {
      onSearch(cleanSearch);
    }

    if (location.pathname !== '/') {
      navigate(`/?keyword=${cleanSearch}`);
    } else {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('keyword', cleanSearch);
      setSearchParams(nextParams);
    }
  };

  const handleSuggestionClick = (title) => {
    setSearchVal(title);
    setTimeout(() => {
      // Trigger search submission
      const cleanSearch = title.trim();
      const updatedHistory = [cleanSearch, ...recentSearches.filter(q => q !== cleanSearch)].slice(0, 5);
      setRecentSearches(updatedHistory);
      localStorage.setItem('shopez-recent-searches', JSON.stringify(updatedHistory));
      
      setShowSuggestions(false);
      if (onSearch) {
        onSearch(cleanSearch);
      }
      if (location.pathname !== '/') {
        navigate(`/?keyword=${cleanSearch}`);
      } else {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('keyword', cleanSearch);
        setSearchParams(nextParams);
      }
    }, 50);
  };

  const clearRecentSearch = (e, q) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = recentSearches.filter(item => item !== q);
    setRecentSearches(updated);
    localStorage.setItem('shopez-recent-searches', JSON.stringify(updated));
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/login');
  };

  // Calculate items count
  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  // Category selection handler
  const handleCategoryClick = (catName) => {
    const nextParams = new URLSearchParams(searchParams);
    if (catName === 'All') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', catName);
    }
    setSearchParams(nextParams);
    if (location.pathname !== '/') {
      navigate(catName === 'All' ? '/' : `/?category=${catName}`);
    }
  };

  return (
    <header className="glass-panel sticky-header">
      <div className="container nav-bar">
        {/* Logo */}
        <Link to="/" className="logo" onClick={() => handleCategoryClick('All')}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span>ShopEZ</span>
        </Link>

        {/* Center Mega Menu & Quick Links */}
        <nav className="nav-middle-links">
          <div className="mega-menu-trigger-wrapper">
            <span className="nav-middle-link-item">
              Categories <ChevronDown size={14} style={{ marginLeft: '2px' }} />
            </span>
            <div className="mega-menu-dropdown glass-panel">
              <div className="mega-menu-grid">
                <div className="mega-menu-column">
                  <h5>Tech & Home</h5>
                  <button onClick={() => handleCategoryClick('Electronics')}>Electronics</button>
                  <button onClick={() => handleCategoryClick('Home Appliances')}>Home Appliances</button>
                  <button onClick={() => handleCategoryClick('Watches')}>Watches</button>
                </div>
                <div className="mega-menu-column">
                  <h5>Apparel & Style</h5>
                  <button onClick={() => handleCategoryClick('Fashion')}>Fashion</button>
                  <button onClick={() => handleCategoryClick('Footwear')}>Footwear</button>
                  <button onClick={() => handleCategoryClick('Accessories')}>Accessories</button>
                </div>
                <div className="mega-menu-column">
                  <h5>Leisure & Care</h5>
                  <button onClick={() => handleCategoryClick('Beauty')}>Beauty</button>
                  <button onClick={() => handleCategoryClick('Sports')}>Sports</button>
                </div>
                <div className="mega-menu-column">
                  <h5>Essentials</h5>
                  <button onClick={() => handleCategoryClick('Grocery')}>Grocery</button>
                  <button onClick={() => handleCategoryClick('Books')}>Books</button>
                </div>
              </div>
            </div>
          </div>
          <Link to="/" onClick={() => handleCategoryClick('All')} className="nav-middle-link-item">
            Shop All
          </Link>
        </nav>

        {/* Autocomplete Search Bar */}
        <div className="search-wrapper" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} style={{ width: '100%', display: 'flex' }}>
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
            />
            <button type="submit" className="search-icon">
              <Search size={18} />
            </button>
          </form>

          {/* Autocomplete Suggestions & History Box */}
          {showSuggestions && (searchVal.trim().length > 1 || recentSearches.length > 0) && (
            <div className="suggestions-box glass-panel">
              {/* Recent Searches */}
              {recentSearches.length > 0 && searchVal.trim().length <= 1 && (
                <div className="suggestions-section">
                  <div className="suggestions-section-title">Recent Searches</div>
                  {recentSearches.map((item, idx) => (
                    <div
                      key={idx}
                      className="suggestion-item recent-search-item"
                      onClick={() => handleSuggestionClick(item)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <History size={14} style={{ opacity: 0.5 }} />
                        <span>{item}</span>
                      </div>
                      <button
                        className="clear-recent-btn"
                        onClick={(e) => clearRecentSearch(e, item)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Autocomplete suggestions */}
              {suggestions.length > 0 && (
                <div className="suggestions-section">
                  <div className="suggestions-section-title">Product Matches</div>
                  {suggestions.map((item) => (
                    <div
                      key={item._id}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(item.name)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={13} style={{ opacity: 0.5 }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="suggestion-category">{item.category}</span>
                    </div>
                  ))}
                </div>
              )}

              {suggestions.length === 0 && searchVal.trim().length > 1 && (
                <div style={{ padding: '12px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  No match suggestions found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Links & Actions */}
        <div className="nav-actions">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="icon-btn theme-toggle"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Wishlist Button */}
          <button
            onClick={toggleWishlist}
            className="icon-btn"
            title="View Wishlist"
          >
            <Heart size={18} />
            {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
          </button>

          {/* Cart Button */}
          <button
            onClick={toggleCart}
            className="icon-btn"
            title="View Shopping Cart"
          >
            <ShoppingCart size={18} />
            {cartItemsCount > 0 && <span className="badge">{cartItemsCount}</span>}
          </button>

          {/* User Account / Admin Panel */}
          {userInfo ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="icon-btn"
                title="Account Settings"
              >
                <User size={18} />
              </button>
              
              {showDropdown && (
                <div
                  className="glass-panel"
                  style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    width: '200px',
                    borderRadius: '12px',
                    padding: '8px',
                    zIndex: '201',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    boxShadow: 'var(--shadow-lg)'
                  }}
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderBottom: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontWeight: '600',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Hi, {userInfo.name}
                  </div>
                  
                  <Link
                    to="/dashboard"
                    className="admin-menu-item"
                    style={{ padding: '8px 12px', borderRadius: '8px' }}
                    onClick={() => setShowDropdown(false)}
                  >
                    My Account
                  </Link>
                  
                  <Link
                    to="/orders"
                    className="admin-menu-item"
                    style={{ padding: '8px 12px', borderRadius: '8px' }}
                    onClick={() => setShowDropdown(false)}
                  >
                    My Orders
                  </Link>
                  
                  {userInfo.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="admin-menu-item"
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        color: 'var(--accent-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={() => setShowDropdown(false)}
                    >
                      <Settings size={14} /> Admin Panel
                    </Link>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="admin-menu-item"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      width: '100%',
                      textAlign: 'left',
                      color: 'var(--danger)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-primary"
              style={{ padding: '8px 20px', fontSize: '13px', display: 'inline-flex' }}
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
