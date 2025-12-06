// src/app.js

const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// =======================
// CORS CONFIG (FIXED)
// =======================

// yaha sirf wahi origins allow kar rahe hain jahan se frontend chalega
const allowedOrigins = [
  "http://localhost:5173", // Vite frontend local
  // "https://tumhara-frontend-domain.com", // future me deploy karoge to yaha add kar dena
];

const corsOptions = {
  origin(origin, callback) {
    // Postman / server-side scripts / health checks ke liye origin null ho sakta hai
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true, // 👈 IMPORTANT: frontend withCredentials: true ke liye
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// global CORS
app.use(cors(corsOptions));
// preflight
app.options("*", cors(corsOptions));

// Debug logger
app.use((req, res, next) => {
  console.log("➡", req.method, req.url, "Origin:", req.headers.origin);
  next();
});

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
      reports: "/api/reports",
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
app.use("/api/reports", require("./routes/reportRoutes"));

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
