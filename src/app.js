// src/app.js

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// =======================
// CORS CONFIG (FINAL)
// =======================
const corsOptions = {
  origin: [
    "http://localhost:5001",
    "http://127.0.0.1:5001",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// =======================
// Body parsers
// =======================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =======================
// Static uploads folder
// =======================
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// =======================
// Root route
// =======================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Furniture Shop Inventory API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      products: "/api/products",
      categories: "/api/categories",
      scan: "/api/scan",
    },
  });
});

// =======================
// API Routes
// =======================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/scan", require("./routes/scanRoutes"));

// =======================
// 404 Handler
// =======================
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// =======================
// Global Error Handler
// =======================
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = app;
