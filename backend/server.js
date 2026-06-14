import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import connectDB from './config/db.js';

// Route files
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import couponRoutes from './routes/couponRoutes.js';

dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom API rate limiting logic
const rateLimitMap = new Map();
app.use('/api', (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute window
  const maxRequests = 120; // 120 requests per minute
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requestTimes = rateLimitMap.get(ip).filter(time => now - time < limitWindow);
  requestTimes.push(now);
  rateLimitMap.set(ip, requestTimes);
  
  if (requestTimes.length > maxRequests) {
    return res.status(429).json({ message: 'Too many requests. Please try again in a minute.' });
  }
  next();
});

// Serve static assets from uploads directory
const __dirname = path.resolve();
const uploadDir = path.join(__dirname, 'backend/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);

// Base Route
app.get('/api', (req, res) => {
  res.json({ message: 'ShopEZ REST API is running successfully.' });
});

// Custom Error Handling Middlewares
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\x1b[35m[Server] Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}\x1b[0m`);
});
