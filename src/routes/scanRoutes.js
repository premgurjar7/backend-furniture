// src/routes/scanRoutes.js
const express = require("express");
const router = express.Router();

const { scanProduct } = require("../controllers/scanController");

// Debug log – server start पर दिखेगा
console.log("✅ scanRoutes loaded");

// POST /api/scan
router.post("/", scanProduct);

module.exports = router;
