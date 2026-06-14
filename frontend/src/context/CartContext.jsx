import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from './AuthContext';

const CartContext = createContext();

const CartProvider = ({ children }) => {
  const { userInfo } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [saveForLater, setSaveForLater] = useState([]);
  const [compareItems, setCompareItems] = useState([]);
  
  // Coupon State
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Toggle compare item
  const toggleCompare = (product) => {
    const exists = compareItems.find((x) => x._id === product._id);
    if (exists) {
      setCompareItems(compareItems.filter((x) => x._id !== product._id));
      return { added: false };
    } else {
      if (compareItems.length >= 3) {
        return { added: false, error: 'You can compare a maximum of 3 products.' };
      }
      setCompareItems([...compareItems, product]);
      return { added: true };
    }
  };

  const clearCompare = () => {
    setCompareItems([]);
  };

  // Load cart, wishlist, and saveForLater from LocalStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('shopez-cart');
    const storedWishlist = localStorage.getItem('shopez-wishlist');
    const storedSFL = localStorage.getItem('shopez-saveforlater');

    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (e) {
        console.error('Error parsing stored cart:', e);
      }
    }

    if (storedWishlist) {
      try {
        setWishlist(JSON.parse(storedWishlist));
      } catch (e) {
        console.error('Error parsing stored wishlist:', e);
      }
    }

    if (storedSFL) {
      try {
        setSaveForLater(JSON.parse(storedSFL));
      } catch (e) {
        console.error('Error parsing stored saveforlater:', e);
      }
    }
  }, []);

  // Fetch wishlist from backend DB on login
  useEffect(() => {
    const fetchDBWishlist = async () => {
      if (userInfo && userInfo.token) {
        try {
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          };
          const { data } = await axios.get('http://localhost:5000/api/auth/wishlist', config);
          setWishlist(data);
          localStorage.setItem('shopez-wishlist', JSON.stringify(data));
        } catch (error) {
          console.error('Error syncing wishlist from DB:', error);
        }
      }
    };
    fetchDBWishlist();
  }, [userInfo]);

  // Sync cart to LocalStorage
  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem('shopez-cart', JSON.stringify(items));
  };

  // Sync wishlist to LocalStorage and backend if logged in
  const saveWishlistState = async (items) => {
    setWishlist(items);
    localStorage.setItem('shopez-wishlist', JSON.stringify(items));
  };

  // Sync Save for Later to LocalStorage
  const saveSFL = (items) => {
    setSaveForLater(items);
    localStorage.setItem('shopez-saveforlater', JSON.stringify(items));
  };

  // Add item to cart
  const addToCart = (product, qty = 1, selectedVariant = null) => {
    // Generate unique cartId based on product id and variant choices
    let cartId = product._id;
    let variantString = '';
    
    if (selectedVariant) {
      const parts = [];
      if (selectedVariant.size) parts.push(`Size: ${selectedVariant.size}`);
      if (selectedVariant.color) parts.push(`Color: ${selectedVariant.color}`);
      if (selectedVariant.storage) parts.push(`Storage: ${selectedVariant.storage}`);
      if (selectedVariant.weight) parts.push(`Weight: ${selectedVariant.weight}`);
      variantString = parts.join(', ');
      
      cartId = `${product._id}-${selectedVariant.size || ''}-${selectedVariant.color || ''}-${selectedVariant.storage || ''}-${selectedVariant.weight || ''}`;
    }

    const existItem = cartItems.find((x) => x.cartId === cartId);
    const maxStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;

    let newCartItems;
    if (existItem) {
      const newQty = existItem.qty + qty;
      if (newQty > maxStock) {
        return { success: false, message: `Only ${maxStock} items available in stock.` };
      }
      newCartItems = cartItems.map((x) =>
        x.cartId === cartId ? { ...x, qty: newQty } : x
      );
    } else {
      if (qty > maxStock) {
        return { success: false, message: `Only ${maxStock} items available in stock.` };
      }
      newCartItems = [
        ...cartItems,
        {
          product: product._id,
          cartId: cartId,
          name: product.name,
          image: product.images[0] || '/images/placeholder.jpg',
          price: product.price,
          qty: qty,
          stockQuantity: maxStock,
          variantString,
          size: selectedVariant?.size || '',
          color: selectedVariant?.color || '',
          storage: selectedVariant?.storage || '',
          weight: selectedVariant?.weight || '',
        },
      ];
    }

    saveCart(newCartItems);
    // Reset coupon if cart changes to force recalculation
    setAppliedCoupon(null);
    return { success: true };
  };

  // Modify item quantity in cart
  const changeQuantity = (cartId, qty) => {
    const item = cartItems.find((x) => x.cartId === cartId);
    if (!item) return;

    if (qty <= 0) {
      removeFromCart(cartId);
      return;
    }

    if (qty > item.stockQuantity) {
      return { success: false, message: `Only ${item.stockQuantity} items in stock.` };
    }

    const newCartItems = cartItems.map((x) =>
      x.cartId === cartId ? { ...x, qty } : x
    );
    saveCart(newCartItems);
    setAppliedCoupon(null);
    return { success: true };
  };

  // Remove item from cart
  const removeFromCart = (cartId) => {
    const newCartItems = cartItems.filter((x) => x.cartId !== cartId);
    saveCart(newCartItems);
    setAppliedCoupon(null);
  };

  // Save for later
  const saveItemForLater = (cartId) => {
    const item = cartItems.find((x) => x.cartId === cartId);
    if (!item) return;

    // Remove from cart
    const newCartItems = cartItems.filter((x) => x.cartId !== cartId);
    saveCart(newCartItems);

    // Add to Save For Later
    if (!saveForLater.some((x) => x.cartId === cartId)) {
      const newSFL = [...saveForLater, item];
      saveSFL(newSFL);
    }
    setAppliedCoupon(null);
  };

  // Move back to cart
  const moveToCart = (item) => {
    // Remove from Save For Later
    const newSFL = saveForLater.filter((x) => x.cartId !== item.cartId);
    saveSFL(newSFL);

    // Add to cart
    const existItem = cartItems.find((x) => x.cartId === item.cartId);
    let newCartItems;
    if (existItem) {
      newCartItems = cartItems.map((x) =>
        x.cartId === item.cartId ? { ...x, qty: x.qty + 1 } : x
      );
    } else {
      newCartItems = [...cartItems, { ...item, qty: 1 }];
    }
    saveCart(newCartItems);
    setAppliedCoupon(null);
  };

  // Remove from SFL
  const removeFromSFL = (cartId) => {
    const newSFL = saveForLater.filter((x) => x.cartId !== cartId);
    saveSFL(newSFL);
  };

  // Clear cart
  const clearCart = () => {
    saveCart([]);
    setAppliedCoupon(null);
  };

  // Toggle wishlist item (synced with DB if logged in)
  const toggleWishlist = async (product) => {
    // Toggle locally first
    const exists = wishlist.find((x) => x._id === product._id);
    let newWishlist;
    let added = false;
    
    if (exists) {
      newWishlist = wishlist.filter((x) => x._id !== product._id);
      added = false;
    } else {
      newWishlist = [...wishlist, product];
      added = true;
    }

    saveWishlistState(newWishlist);

    // Sync with backend DB if authenticated
    if (userInfo && userInfo.token) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        await axios.post(`http://localhost:5000/api/auth/wishlist/${product._id}`, {}, config);
      } catch (error) {
        console.error('Error syncing wishlist with server:', error);
      }
    }
    return { added };
  };

  // Apply Coupon
  const applyCouponCode = async (code) => {
    if (!userInfo) {
      return { success: false, message: 'Please log in to apply coupons.' };
    }
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const { data } = await axios.post(
        'http://localhost:5000/api/coupons/apply',
        { code, amount: itemsPrice },
        config
      );
      setAppliedCoupon(data);
      return { success: true, message: `Coupon "${code.toUpperCase()}" applied successfully!` };
    } catch (error) {
      setAppliedCoupon(null);
      return { success: false, message: error.response?.data?.message || 'Invalid coupon code.' };
    }
  };

  // Remove Coupon
  const removeCouponCode = () => {
    setAppliedCoupon(null);
  };

  // Pricing calculations
  const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shippingPrice = itemsPrice > 100 || itemsPrice === 0 ? 0 : 9.99;
  const taxPrice = itemsPrice * 0.08; // 8% sales tax
  
  // Apply coupon discount
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const totalPrice = Math.max(0, itemsPrice - couponDiscount + shippingPrice + taxPrice);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlist,
        saveForLater,
        addToCart,
        changeQuantity,
        removeFromCart,
        saveItemForLater,
        moveToCart,
        removeFromSFL,
        clearCart,
        toggleWishlist,
        
        // Compare Exports
        compareItems,
        toggleCompare,
        clearCompare,
        
        // Coupon Exports
        appliedCoupon,
        applyCouponCode,
        removeCouponCode,
        couponDiscount,

        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export { CartContext, CartProvider };
export default CartContext;

