// src/app.js

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ IMPORTANT: Serve static files from root uploads folder
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Furniture Shop Inventory API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products'
    }
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use("/api/scan", require("./routes/scanRoutes"));

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;