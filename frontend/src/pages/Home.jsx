import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, Filter, RotateCcw, Flame, Sparkles, TrendingUp, Award, Clock, ArrowLeftRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const Home = ({ showToast }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Load keyword and category from URL query parameters
  const keywordQuery = searchParams.get('keyword') || '';
  const categoryQuery = searchParams.get('category') || 'All';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Sorting State (price, rating, brand, discount, availability, sorting, page)
  const [category, setCategory] = useState(categoryQuery);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Hero Slider State
  const [activeSlide, setActiveSlide] = useState(0);

  // Flash Sale Countdown Timer State
  const [countdown, setCountdown] = useState({ hours: 4, minutes: 35, seconds: 12 });

  // Hero Slides Data
  const slides = [
    {
      title: 'ShopEZ Premium E-Commerce',
      desc: 'Discover our premium curation of ergonomic gear, fashion apparel, books, beauty, and tech gadgets with zero-latency delivery.',
      image: 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=1200&q=80',
      tag: 'Grand Festival Sale'
    },
    {
      title: 'Elevate Your Gaming Setup',
      desc: 'Tactile mechanical keyboards, ergonomic vertical mice, and hybrid active noise cancellation sound accessories.',
      image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=1200&q=80',
      tag: '20% OFF TECH SPOTLIGHT'
    },
    {
      title: 'Timeless Premium Aesthetics',
      desc: 'Handcrafted full-grain leather accessories and solar-powered chronograph watches styled for modern lifestyles.',
      image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=1200&q=80',
      tag: 'Exclusive Wardrobe'
    }
  ];

  // Testimonials Data
  const testimonials = [
    {
      name: 'Sarah Jenkins',
      role: 'Verified Customer',
      comment: 'Absolutely love the delivery speed and product variants options! The leather bag I got smells premium and the layout is very clean.',
      rating: 5,
      avatar: 'SJ'
    },
    {
      name: 'Michael Chen',
      role: 'Tech Consultant',
      comment: 'The mechanical keyboard is phenomenal. Hot-swappable tactile switches run quiet and responsive. Best customer service ever!',
      rating: 5,
      avatar: 'MC'
    },
    {
      name: 'David K.',
      role: 'Loyal Shopper',
      comment: 'Checkout payment simulations are so realistic and simple. Easy multi-address tracking made shipping my packages painless.',
      rating: 5,
      avatar: 'DK'
    }
  ];

  // Autoplay Hero Slider
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, []);

  // Flash Sale Countdown Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 4, minutes: 0, seconds: 0 }; // reset
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to URL search parameter changes
  useEffect(() => {
    setCategory(categoryQuery);
    setPage(1); // reset to page 1 on filter/search change
  }, [categoryQuery, keywordQuery]);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          keyword: keywordQuery,
          sortBy,
          pageNumber: page,
          limit: 12
        };

        if (category && category !== 'All') {
          params.category = category;
        }
        if (selectedBrand && selectedBrand !== 'All') {
          params.brand = selectedBrand;
        }
        if (selectedRating && selectedRating !== 'All') {
          params.rating = Number(selectedRating);
        }
        if (minPrice) {
          params.minPrice = minPrice;
        }
        if (maxPrice) {
          params.maxPrice = maxPrice;
        }
        if (onlyDiscounted) {
          params.discount = 'true';
        }
        if (onlyInStock) {
          params.availability = 'in-stock';
        }

        const { data } = await axios.get('http://localhost:5000/api/products', { params });
        
        if (data && data.products) {
          setProducts(data.products);
          setTotalPages(data.pages || 1);
          setTotalProducts(data.totalProducts || 0);
        } else {
          // Fallback if database seeder or legacy endpoint returned array directly
          setProducts(Array.isArray(data) ? data : []);
          setTotalPages(1);
          setTotalProducts(Array.isArray(data) ? data.length : 0);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        showToast('Failed to load products database.', 'danger');
      }
      setLoading(false);
    };

    fetchProducts();
  }, [category, minPrice, maxPrice, sortBy, selectedBrand, selectedRating, onlyDiscounted, onlyInStock, page, keywordQuery]);

  // Reset Filters
  const handleResetFilters = () => {
    setCategory('All');
    setMinPrice('');
    setMaxPrice('');
    setSelectedBrand('All');
    setSelectedRating('All');
    setOnlyDiscounted(false);
    setOnlyInStock(false);
    setSortBy('newest');
    setPage(1);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('category');
    nextParams.delete('keyword');
    setSearchParams(nextParams);
  };

  // Quick category chip helper
  const handleCategoryChipClick = (catName) => {
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (catName === 'All') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', catName);
    }
    setSearchParams(nextParams);
    
    // Smooth scroll to catalog grid
    setTimeout(() => {
      const el = document.getElementById('catalog-grid');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // Categories Showcase List
  const categoriesShowcaseList = [
    { name: 'Electronics', icon: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=300&q=80' },
    { name: 'Fashion', icon: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=300&q=80' },
    { name: 'Footwear', icon: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=300&q=80' },
    { name: 'Watches', icon: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80' },
    { name: 'Home Appliances', icon: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80' },
    { name: 'Sports', icon: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=300&q=80' },
    { name: 'Beauty', icon: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=300&q=80' },
    { name: 'Grocery', icon: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80' },
    { name: 'Accessories', icon: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=300&q=80' },
    { name: 'Books', icon: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=300&q=80' }
  ];

  // List of all categories for filter options
  const allCategories = ['All', ...categoriesShowcaseList.map(c => c.name)];
  
  // Brands list (compiled from seeder metadata)
  const brandsList = ['All', 'Sonyx', 'Acoustix', 'Nova', 'LogiPro', 'ZaraFit', 'Levis-Craft', 'Nike-Craft', 'Casio-Tech', 'Citizen-Lux', 'Breville-Brew', 'Dyson-Air', 'Loreal-Lux', 'Organix', 'Bellroy-Craft'];

  // Render Skeleton Placeholders during Loading
  const renderSkeletons = () => {
    return Array.from({ length: 8 }).map((_, idx) => (
      <div key={idx} className="product-card skeleton-card">
        <div className="skeleton skeleton-image"></div>
        <div className="skeleton-details">
          <div className="skeleton skeleton-text skeleton-cat"></div>
          <div className="skeleton skeleton-text skeleton-title"></div>
          <div className="skeleton skeleton-text skeleton-rating"></div>
          <div className="skeleton-footer">
            <div className="skeleton skeleton-text skeleton-price"></div>
            <div className="skeleton skeleton-circle"></div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="container">
      {/* Hero Slideshow */}
      <section className="hero-section">
        <div className="hero-slider">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`hero-slide ${idx === activeSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="hero-overlay"></div>
              <div className="hero-content">
                <span className="hero-tag">{slide.tag}</span>
                <h2>{slide.title}</h2>
                <p>{slide.desc}</p>
                <button
                  onClick={() => {
                    document.getElementById('catalog-grid').scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-primary"
                >
                  Shop Catalog <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* Slider Dots */}
          <div className="hero-controls">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`hero-dot ${idx === activeSlide ? 'active' : ''}`}
                onClick={() => setActiveSlide(idx)}
              ></span>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Promo Banner for Seasonal Offers */}
      <section className="promo-banner glass-panel">
        <div className="promo-left">
          <Sparkles size={24} className="text-gradient" />
          <div>
            <h3>FESTIVAL MEGA DISCOUNTS</h3>
            <p>Save flat 30% using coupon code <strong className="text-gradient">FLASHSALE30</strong> at checkout!</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setOnlyDiscounted(true);
            document.getElementById('catalog-grid').scrollIntoView({ behavior: 'smooth' });
          }}
          className="btn-primary" 
          style={{ padding: '8px 20px', fontSize: '13px' }}
        >
          View Deals
        </button>
      </section>

      {/* Categories Showcase Circle Hub */}
      <section className="homepage-section">
        <div className="section-header">
          <h3>Browse By Category</h3>
          <p>Explore premium products catalogued across our 10 primary categories.</p>
        </div>
        <div className="categories-circle-grid">
          {categoriesShowcaseList.map((c) => (
            <div 
              key={c.name} 
              className={`category-circle-card ${category === c.name ? 'active' : ''}`}
              onClick={() => handleCategoryChipClick(c.name)}
            >
              <div className="category-circle-image">
                <img src={c.icon} alt={c.name} />
              </div>
              <div className="category-circle-name">{c.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Flash Sale Section with Countdown Timer */}
      <section className="homepage-section flash-sale-panel glass-panel">
        <div className="flash-sale-header">
          <div className="flash-sale-title">
            <Flame size={22} color="var(--danger)" />
            <h3>Flash Sales Of The Day</h3>
            <div className="countdown-timer">
              <Clock size={14} style={{ marginRight: '4px' }} />
              <span>Ends In: </span>
              <span className="timer-pill">{String(countdown.hours).padStart(2, '0')}</span>
              <span>:</span>
              <span className="timer-pill">{String(countdown.minutes).padStart(2, '0')}</span>
              <span>:</span>
              <span className="timer-pill">{String(countdown.seconds).padStart(2, '0')}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              setSortBy('price-asc');
              setOnlyDiscounted(true);
              document.getElementById('catalog-grid').scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-secondary" 
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            See All Deals
          </button>
        </div>
        <div className="flash-sale-grid">
          {products.slice(0, 4).map((prod) => (
            <div key={prod._id} className="flash-sale-card" onClick={() => navigate(`/product/${prod._id}`)}>
              <div className="flash-badge">-{prod.discountValue}% OFF</div>
              <img src={prod.images[0] || '/images/placeholder.jpg'} alt={prod.name} />
              <h4>{prod.name}</h4>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                <span className="flash-price">₹{prod.price.toFixed(2)}</span>
                <span className="flash-original-price">₹{prod.originalPrice.toFixed(2)}</span>
              </div>
              <div className="flash-stock-bar">
                <div 
                  className="flash-stock-fill" 
                  style={{ width: `${(prod.stockQuantity / 45) * 100}%` }}
                ></div>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Only {prod.stockQuantity} items left in stock!
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Main Grid Shop Catalog Layout */}
      <div className="shop-layout" id="catalog-grid" style={{ marginTop: '40px' }}>
        {/* Filters Sidebar */}
        <aside className="filters-sidebar glass-panel" style={{ borderRadius: 'var(--border-radius-md)' }}>
          <div className="filter-section">
            <h3 className="filter-title">
              <span>Price Range</span>
              <Filter size={14} style={{ opacity: 0.7 }} />
            </h3>
            <div className="price-range-inputs">
              <input
                type="number"
                placeholder="Min (₹)"
                value={minPrice}
                onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
              />
              <span style={{ color: 'var(--text-tertiary)' }}>—</span>
              <input
                type="number"
                placeholder="Max (₹)"
                value={maxPrice}
                onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
              />
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Categories</h3>
            <div className="checkbox-group">
              {allCategories.map((cat) => (
                <label key={cat} className="checkbox-label">
                  <input
                    type="radio"
                    name="category-radio"
                    checked={category === cat}
                    onChange={() => handleCategoryChipClick(cat)}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Filter by Brand</h3>
            <select 
              value={selectedBrand} 
              onChange={(e) => { setSelectedBrand(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '8px' }}
            >
              {brandsList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Customer Reviews</h3>
            <div className="checkbox-group">
              {['All', '4', '3', '2'].map((star) => (
                <label key={star} className="checkbox-label">
                  <input
                    type="radio"
                    name="rating-radio"
                    checked={selectedRating === star}
                    onChange={() => { setSelectedRating(star); setPage(1); }}
                  />
                  <span>{star === 'All' ? 'All Ratings' : `${star}★ & above`}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-title">Offers & Stock</h3>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={onlyDiscounted}
                  onChange={(e) => { setOnlyDiscounted(e.target.checked); setPage(1); }}
                />
                <span>Discounted Items</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => { setOnlyInStock(e.target.checked); setPage(1); }}
                />
                <span>Exclude Out of Stock</span>
              </label>
            </div>
          </div>

          {/* Reset Buttons */}
          <button
            onClick={handleResetFilters}
            className="btn-secondary"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              marginTop: '16px'
            }}
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        </aside>

        {/* Products Grid Section */}
        <main className="products-wrapper">
          <div className="products-header">
            <span className="results-count">
              {loading ? 'Searching products...' : `${totalProducts} Premium items found`}
              {keywordQuery && ` for "${keywordQuery}"`}
            </span>

            {/* Sorting */}
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="sort-select"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Rating: Highest Reviews</option>
              <option value="best-selling">Deals: Best Selling</option>
              <option value="most-popular">Popularity: Reviews</option>
            </select>
          </div>

          {/* Grid Render */}
          {loading ? (
            <div className="products-grid">
              {renderSkeletons()}
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state glass-panel" style={{ borderRadius: 'var(--border-radius-md)' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <h3>No products match your criteria.</h3>
              <p style={{ marginTop: '8px', fontSize: '14px' }}>
                Try adjusting your filters, reset options, or explore other category chips.
              </p>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} showToast={showToast} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-wrapper flex-center" style={{ marginTop: '40px', gap: '8px' }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    className="btn-secondary"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{ padding: '8px 16px', borderRadius: '8px' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Customer Testimonials Slider */}
      <section className="homepage-section" style={{ marginTop: '60px', marginBottom: '40px' }}>
        <div className="section-header">
          <h3>Customer Testimonials</h3>
          <p>See what our users have to say about their premium shopping experiences.</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, idx) => (
            <div key={idx} className="testimonial-card glass-panel">
              <div className="testimonial-avatar">{t.avatar}</div>
              <h4>{t.name}</h4>
              <span className="testimonial-role">{t.role}</span>
              <div className="testimonial-rating" style={{ color: 'var(--warning)', margin: '8px 0' }}>
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="testimonial-comment">"{t.comment}"</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
