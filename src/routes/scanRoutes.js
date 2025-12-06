// src/routes/scanRoutes.js

const express = require("express");
const router = express.Router();
const scanController = require("../controllers/scanController");

// IMPORTANT:
// STATIC routes (recent, history) ALWAYS before "/:code"

// Recent scans list
// GET /api/scan/recent
router.get("/recent", scanController.recentScans);

// Full scan history (with optional filters)
// GET /api/scan/history?from=2025-12-01&to=2025-12-05&code=FUR-001
router.get("/history", scanController.scanHistory);

// Save scan history
// POST /api/scan
router.post("/", scanController.saveScan);

// Scan by code (single product by code)
// GET /api/scan/FUR-001
router.get("/:code", scanController.scanByCode);

module.exports = router;
