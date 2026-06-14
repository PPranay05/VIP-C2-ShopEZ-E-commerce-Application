import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Coupon from './models/Coupon.js';
import connectDB from './config/db.js';

dotenv.config();

// Connect to Database
connectDB();

// Mock Users Data
const users = [
  {
    name: 'ShopEZ Admin',
    email: 'admin@shopez.com',
    password: 'adminpassword123', // will be hashed by mongoose pre-save hook
    role: 'admin',
    address: {
      street: '100 Admin HQ Way',
      city: 'Silicon Valley',
      postalCode: '94025',
      country: 'USA'
    },
    addresses: [
      {
        addressType: 'Office',
        street: '100 Admin HQ Way',
        city: 'Silicon Valley',
        postalCode: '94025',
        country: 'USA'
      }
    ]
  },
  {
    name: 'John Doe',
    email: 'john@gmail.com',
    password: 'customerpassword123',
    role: 'customer',
    address: {
      street: '123 Pine St',
      city: 'New York',
      postalCode: '10001',
      country: 'USA'
    },
    addresses: [
      {
        addressType: 'Home',
        street: '123 Pine St',
        city: 'New York',
        postalCode: '10001',
        country: 'USA'
      },
      {
        addressType: 'Office',
        street: '550 Broadway St',
        city: 'New York',
        postalCode: '10012',
        country: 'USA'
      }
    ]
  }
];

// 10 categories template data
const categoriesData = {
  Electronics: {
    brands: ['Sonyx', 'Acoustix', 'Nova', 'LogiPro', 'Delluxe', 'Volt', 'PixelLink', 'HyperX'],
    names: ['Wireless Gaming Mouse', 'Mechanical Keyboard', 'ANC Wireless Headphones', 'Bluetooth Party Speaker', 'Multi Charging Dock', 'UltraWide 1080p Webcam', 'Fast 1TB Portable SSD', 'Ergonomic Vertical Mouse', 'RGB LED Smart Strip', 'USB-C Hub Multiport Adapter'],
    images: [
      'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=600&q=80'
    ],
    descriptions: [
      'High-performance device crafted for maximum accuracy, durability, and ergonomic support in everyday workflows.',
      'Features custom responsive switches, structural integrity, and gorgeous modern lighting effects to light up your desk.'
    ],
    variantOpts: { storage: ['128GB', '256GB', '512GB'] }
  },
  Fashion: {
    brands: ['UrbanStyle', 'Levis-Craft', 'ZaraFit', 'AeroStyle', 'ThreadCraft', 'Vanguard'],
    names: ['Classic Denim Jacket', 'Slim Fit Chino Pants', 'Cotton Bomber Jacket', 'Crewneck Knit Sweater', 'Linen Casual Shirt', 'Waterproof Rain Parka', 'Graphic Print Tee', 'Athletic Fit Joggers', 'Premium Leather Belt', 'Merino Wool Scarf'],
    images: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=600&q=80'
    ],
    descriptions: [
      'Woven from premium organic materials, offering top-tier comfort, breathable wear, and a timeless silhouette.',
      'Designed to keep up with modern trends, offering a stylish aesthetic for casual outings and semi-formal meetings.'
    ],
    variantOpts: { size: ['S', 'M', 'L', 'XL'], color: ['Charcoal Black', 'Navy Blue', 'Classic White'] }
  },
  Footwear: {
    brands: ['Nike-Craft', 'Adidas-Run', 'PumaFit', 'Reebok-Lite', 'TimberStep', 'Clarks-Walk'],
    names: ['Breathable Road Running Shoes', 'Orthopedic Walking Sneakers', 'Waterproof Hiking Boots', 'Classic Suede Loafers', 'Lightweight Gym Trainers', 'Leather Dress Chelsea Boots', 'Canvas Streetwear Sneakers', 'Slip-On Comfort Sandals', 'Trail Running Grip Shoes', 'Classic Leather Brogues'],
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80'
    ],
    descriptions: [
      'Engineered with response cushioning soles, breathable mesh knit uppers, and impact-absorbent technology.',
      'Handcrafted premium leather footwear built to ensure foot support and premium styling, appropriate for all terrains.'
    ],
    variantOpts: { size: ['7', '8', '9', '10', '11'], color: ['Red Flame', 'Ocean Blue', 'Core Black'] }
  },
  Watches: {
    brands: ['Casio-Tech', 'Seiko-Classic', 'Citizen-Lux', 'Fossil-Style', 'Chronos', 'Rolexx-Sport'],
    names: ['Smart Fitness Watch Edition 5', 'Analog Classic Leather Watch', 'Solar-Powered Chronograph Watch', 'Stainless Steel Quartz Watch', 'Military Rugged Digital Watch', 'Minimalist Mesh Strap Watch', 'Automatic Mechanical Watch', 'Titanium Diving Watch', 'Rose Gold Luxury Watch', 'Hybrid Smartwatch Sport'],
    images: [
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=600&q=80'
    ],
    descriptions: [
      'Premium watch featuring highly accurate movements, scratch-resistant sapphire crystal glass, and elegant bezels.',
      'Always-on displays, biometric monitoring trackers, and multiple days of battery life wrapped in modern style.'
    ],
    variantOpts: { color: ['Gunmetal Grey', 'Rose Gold', 'Classic Silver'] }
  },
  Books: {
    brands: ['Penguin Books', 'HarperCollins', 'Random House', 'Macmillan', 'Oxford Press', 'OReilly Media'],
    names: ['Clean Code Architectures', 'Designing Microservices APIs', 'The Lean Startup Handbook', 'Quantum Physics Explained', 'Mastering Financial Markets', 'The Psychology of Selling', 'A Brief History of Science', 'Effective Project Leadership', 'Machine Learning Foundations', 'Database Deep Dive Internals'],
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80'
    ],
    descriptions: [
      'Written by industry practitioners, this bestseller delivers step-by-step guidance on structural frameworks and theory.',
      'An absolute must-read guide filled with real-world case studies, actionable formulas, and structured workflows.'
    ],
    variantOpts: { size: ['Paperback', 'Hardcover', 'Kindle Edition'] }
  },
  'Home Appliances': {
    brands: ['Dyson-Air', 'Philips-Smart', 'Panashiba', 'Samsung-Cool', 'LG-Tech', 'Breville-Brew'],
    names: ['Compact Espresso Coffee Maker', 'Rapid Air Fryer 5L', 'HEPA Smart Air Purifier', 'Robotic Vacuum & Mop Cleaner', 'Professional Hand Blender Set', 'Digital Glass Stand Mixer', 'Cordless Stick Vacuum Cleaner', 'Steam Fabric Garment Iron', 'Dual Temp Wine Cooler Cabinet', 'Smart Countertop Toaster Oven'],
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=600&q=80'
    ],
    descriptions: [
      'High-efficiency home appliance packing state-of-the-art motors, silent operations, and sleek design.',
      'Saves preparation time with automated program cycles, smart phone controls, and low power footprint ratings.'
    ],
    variantOpts: { color: ['Obsidian Black', 'Metallic Silver', 'Arctic White'] }
  },
  Sports: {
    brands: ['Nike-Sport', 'Wilson-Play', 'Spalding-Core', 'Decathlon-Grip', 'Everlast', 'YogiMat'],
    names: ['Ergonomic Yoga Mat 6mm', 'Adjustable Dumbbells Set 20kg', 'Pro Match Soccer Ball', 'High-Tension Tennis Racket', 'Waterproof Camping Tent 3P', 'Insulated Sport Water Bottle', 'Hydration Pack Backpack 10L', 'Weighted Jump Rope Speed', 'Resistances Bands Multi-pack', 'Foldable Exercise Fitness Bench'],
    images: [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1600881333168-2ef49b341f30?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1545486332-9e0999c535b2?auto=format&fit=crop&w=600&q=80'
    ],
    descriptions: [
      'Built using durable, sweat-resistant compounds optimized to offer peak performance support for athletes.',
      'Highly portable, heavy-duty sporting gear suitable for home gym setups, outdoor adventures, or fitness bootcamps.'
    ],
    variantOpts: { weight: ['Light Weight', 'Medium Weight', 'Heavy Weight'] }
  },
  Beauty: {
    brands: ['Loreal-Lux', 'Clinique-Glow', 'Ordinary-Clean', 'Kiehl-Smooth', 'Estee-Pure', 'Nivea-Soft'],
    names: ['Hydrating Hyaluronic Serum', 'Organic Tea Tree Face Wash', 'Premium Shea Body Butter', 'Mineral Sunscreen SPF 50', 'Anti-Aging Retinol Eye Cream', 'Vitamin C Brightening Mask', 'Volumizing Waterproof Mascara', 'Exfoliating Coffee Scrub', 'Matte Longwear Lip Gloss', 'Argan Oil Hair Treatment'],
    images: [
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80'
    ],
    descriptions: [
      'Formulated with organic and dermatologically tested botanical extracts to restore natural moisture balances.',
      'Promotes cellular repair, brightness, and deep cleansing properties. Paraben-free and cruelty-free.'
    ],
    variantOpts: { size: ['50ml', '100ml', '200ml'] }
  },
  Grocery: {
    brands: ['Organix', 'GoldenGrain', 'PureNectar', 'Nuts&Berries', 'BaristaBlend', 'SweetMeadows'],
    names: ['Organic Cold-Pressed Olive Oil', 'Premium Roasted Whole Almonds', 'Organic Raw Wildflower Honey', 'Himalayan Pink Salt Grinder', 'Whole Bean Dark Roast Coffee', 'Gluten-Free Rolled Oats 1kg', 'Organic Chia Seeds 500g', 'Premium Green Tea Bags 50s', 'Gluten-Free Quinoa Grain 1kg', 'Pure Maple Syrup Grade A'],
    images: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'
    ],
    descriptions: [
      '100% natural, nutrient-dense organic grocery staple, sourced directly from certified ethical farms.',
      'Carefully packed to retain absolute freshness and rich flavors. Excellent addition to healthy dietary lifestyles.'
    ],
    variantOpts: { weight: ['250g', '500g', '1kg'] }
  },
  Accessories: {
    brands: ['Vanguard-Gear', 'UrbanLeather', 'HydroPeak', 'Bellroy-Craft', 'Ray-Shield', 'Sentry-Lock'],
    names: ['Minimalist Leather Wallet', 'Water-Resistant Sling Bag', 'Polarized Sunglasses UV400', 'Travel Passport Wallet Organizer', 'Vacuum Insulated Flask 1L', 'Steel Keychain Bottle Opener', 'Sleek Laptop Sleeve 14"', 'RFID Blocking Slim Cardholder', 'Lightweight Foldable Umbrella', 'Tech Cable Organizer Pouch'],
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80'
    ],
    descriptions: [
      'Engineered with premium water-resistant materials, secure zip pockets, and lightweight frames.',
      'Sleek modern aesthetics merged with exceptional organizational utility. Perfect for urban commuting.'
    ],
    variantOpts: { color: ['Tan Brown', 'Midnight Black', 'Slate Grey'] }
  }
};

const importData = async () => {
  // Wait 1.5 seconds to see if DB connects
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Pre-generate products & coupons to use in both MongoDB & JSON File modes
  const seededProducts = [];
  const categoryKeys = Object.keys(categoriesData);

  // Generate mock user IDs to map reviews/FAQs properly
  const mockAdminId = new mongoose.Types.ObjectId().toString();
  const mockCustomerId = new mongoose.Types.ObjectId().toString();

  for (const catName of categoryKeys) {
    const cat = categoriesData[catName];

    for (let i = 1; i <= 21; i++) {
      const brand = cat.brands[i % cat.brands.length];
      const nameTemplate = cat.names[i % cat.names.length];
      const name = `${brand} ${nameTemplate} ${i * 10}`;
      const image = cat.images[i % cat.images.length];
      const desc = cat.descriptions[i % cat.descriptions.length] + ` (Model Pro Version ${i * 3})`;
      
      const basePrice = Math.floor(Math.random() * (120 - 15) + 15) * 80;
      const originalPrice = Math.floor(basePrice * 1.25);

      let discountType = 'none';
      let discountValue = 0;
      let price = basePrice;
      let isBOGO = false;
      let dealType = 'none';

      if (i % 3 === 0) {
        discountType = 'percentage';
        discountValue = 20;
        price = Number((originalPrice * 0.8).toFixed(2));
        dealType = "Today's Deal";
      } else if (i % 5 === 0) {
        discountType = 'flat';
        discountValue = 10 * 80;
        price = Math.max(5 * 80, originalPrice - 10 * 80);
        dealType = 'Mega Sale';
      } else if (i % 7 === 0) {
        isBOGO = true;
        dealType = 'Weekend Offer';
      }

      if (i % 11 === 0) {
        dealType = 'Clearance Sale';
      } else if (i % 13 === 0) {
        dealType = 'Best Deal';
      }

      const stockQuantity = Math.floor(Math.random() * (45 - 2) + 2);

      const variants = [];
      const optKeys = Object.keys(cat.variantOpts);
      
      if (optKeys.length === 1) {
        const key = optKeys[0];
        const vals = cat.variantOpts[key];
        vals.forEach((val) => {
          variants.push({
            _id: new mongoose.Types.ObjectId().toString(),
            [key]: val,
            stockQuantity: Math.floor(stockQuantity / vals.length) || 1
          });
        });
      } else if (optKeys.length === 2) {
        const key1 = optKeys[0];
        const key2 = optKeys[1];
        const vals1 = cat.variantOpts[key1];
        const vals2 = cat.variantOpts[key2];
        
        vals1.forEach((v1) => {
          vals2.forEach((v2) => {
            variants.push({
              _id: new mongoose.Types.ObjectId().toString(),
              [key1]: v1,
              [key2]: v2,
              stockQuantity: Math.floor(stockQuantity / (vals1.length * vals2.length)) || 1
            });
          });
        });
      }

      const reviews = [
        {
          _id: new mongoose.Types.ObjectId().toString(),
          name: 'Emily Watson',
          rating: Math.floor(Math.random() * (5 - 4 + 1)) + 4,
          comment: 'Fantastic quality product. Far exceeded my expectations. Sleek design and works flawlessly.',
          image: '',
          isVerified: true,
          helpfulVotes: Math.floor(Math.random() * 8),
          user: mockCustomerId,
          votedUsers: [],
          createdAt: new Date().toISOString()
        },
        {
          _id: new mongoose.Types.ObjectId().toString(),
          name: 'Oliver Twist',
          rating: Math.floor(Math.random() * (5 - 3 + 1)) + 3,
          comment: 'Overall a very solid purchase. Delivery was quick and packaging was premium. Good value for money.',
          image: '',
          isVerified: false,
          helpfulVotes: Math.floor(Math.random() * 4),
          user: mockCustomerId,
          votedUsers: [],
          createdAt: new Date().toISOString()
        }
      ];

      const ratingAvg = Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1));

      const faqs = [
        {
          _id: new mongoose.Types.ObjectId().toString(),
          question: 'Does this product come with a manufacturer warranty?',
          answer: 'Yes, it includes a 1-year standard warranty that covers manufacturing defects.',
          user: mockCustomerId,
          createdAt: new Date().toISOString()
        },
        {
          _id: new mongoose.Types.ObjectId().toString(),
          question: 'Is there a free shipping options for this item?',
          answer: 'Yes, we provide free express delivery for orders over $100.',
          user: mockCustomerId,
          createdAt: new Date().toISOString()
        }
      ];

      seededProducts.push({
        _id: new mongoose.Types.ObjectId().toString(),
        name,
        brand,
        description: desc,
        price,
        originalPrice,
        discountType,
        discountValue,
        isBOGO,
        dealType,
        category: catName,
        stockQuantity,
        images: [image],
        rating: ratingAvg,
        numReviews: reviews.length,
        variants,
        reviews,
        faqs,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  const coupons = [
    {
      _id: new mongoose.Types.ObjectId().toString(),
      code: 'WELCOME10',
      discountType: 'percentage',
      discountValue: 10,
      expiryDate: new Date('2028-12-31T23:59:59Z').toISOString(),
      minPurchase: 30 * 80,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      code: 'FESTIVAL20',
      discountType: 'flat',
      discountValue: 20 * 80,
      expiryDate: new Date('2028-12-31T23:59:59Z').toISOString(),
      minPurchase: 120 * 80,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: new mongoose.Types.ObjectId().toString(),
      code: 'FLASHSALE30',
      discountType: 'percentage',
      discountValue: 30,
      expiryDate: new Date('2028-12-31T23:59:59Z').toISOString(),
      minPurchase: 50 * 80,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  if (mongoose.connection.readyState !== 1) {
    console.log('\x1b[33m[Seeder] MongoDB connection not available. Seeding to local JSON files...\x1b[0m');
    try {
      const DATA_DIR = path.join(path.resolve(), 'backend/data');
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // Hash user passwords programmatically
      const hashedUsers = await Promise.all(users.map(async (u, idx) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(u.password, salt);
        return {
          ...u,
          _id: idx === 0 ? mockAdminId : mockCustomerId,
          password: hashedPassword,
          isBlocked: false,
          walletBalance: 40000.00,
          wishlist: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }));

      // Adjust reviewer IDs to match JSON users
      seededProducts.forEach(p => {
        p.reviews.forEach(r => {
          r.user = mockCustomerId;
        });
        p.faqs.forEach(f => {
          f.user = mockCustomerId;
        });
      });

      fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(hashedUsers, null, 2));
      fs.writeFileSync(path.join(DATA_DIR, 'products.json'), JSON.stringify(seededProducts, null, 2));
      fs.writeFileSync(path.join(DATA_DIR, 'coupons.json'), JSON.stringify(coupons, null, 2));
      fs.writeFileSync(path.join(DATA_DIR, 'orders.json'), JSON.stringify([], null, 2));

      console.log('\x1b[32m[Seeder] Local fallback JSON files seeded successfully!\x1b[0m');
      process.exit(0);
    } catch (err) {
      console.error(`\x1b[31m[Seeder] JSON File Seeder Error: ${err.message}\x1b[0m`);
      process.exit(1);
    }
  }

  try {
    // Clear existing collections
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Coupon.deleteMany();

    // Insert sample users (which hashes their passwords via mongoose pre-save)
    const createdUsers = await User.insertMany(users);
    
    // Fetch the admin user id
    const adminUser = createdUsers[0]._id;
    const customerUser = createdUsers[1]._id;

    // Attach admin as publisher for products and map dummy reviews users to actual customers
    const sampleProducts = seededProducts.map((product) => {
      // Map reviews to the seed customer user
      const reviews = product.reviews.map(r => ({
        ...r,
        user: customerUser
      }));
      return { ...product, reviews, user: adminUser };
    });

    await Product.insertMany(sampleProducts);
    await Coupon.insertMany(coupons);

    console.log('\x1b[32m[Seeder] Data Imported Successfully to MongoDB!\x1b[0m');
    process.exit();
  } catch (error) {
    console.error(`\x1b[31m[Seeder] Import Error: ${error.message}\x1b[0m`);
    process.exit(1);
  }
};

const destroyData = async () => {
  // Wait 1.5 seconds to see if DB connects
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (mongoose.connection.readyState !== 1) {
    console.log('\x1b[31m[Seeder] MongoDB connection not available. Destroying local JSON files...\x1b[0m');
    try {
      const DATA_DIR = path.join(path.resolve(), 'backend/data');
      if (fs.existsSync(DATA_DIR)) {
        fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify([]));
        fs.writeFileSync(path.join(DATA_DIR, 'products.json'), JSON.stringify([]));
        fs.writeFileSync(path.join(DATA_DIR, 'coupons.json'), JSON.stringify([]));
        fs.writeFileSync(path.join(DATA_DIR, 'orders.json'), JSON.stringify([]));
      }
      console.log('\x1b[31m[Seeder] Local JSON files cleared successfully.\x1b[0m');
      process.exit(0);
    } catch (err) {
      console.error(`\x1b[31m[Seeder] JSON File Clear Error: ${err.message}\x1b[0m`);
      process.exit(1);
    }
  }

  try {
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    await Coupon.deleteMany();

    console.log('\x1b[31m[Seeder] Data Destroyed successfully from MongoDB.\x1b[0m');
    process.exit();
  } catch (error) {
    console.error(`\x1b[31m[Seeder] Destroy Error: ${error.message}\x1b[0m`);
    process.exit(1);
  }
};

// Check arguments
if (process.argv[2] === '-destroy') {
  destroyData();
} else {
  importData();
}
