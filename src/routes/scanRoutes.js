// src/routes/scanRoutes.js

const express = require("express");
const router = express.Router();
const scanController = require("../controllers/scanController");

// Recent scans list
router.get("/recent", scanController.recentScans);

// Save scan history
router.post("/", scanController.saveScan);

// Scan by code
router.get("/:code", scanController.scanByCode);

module.exports = router;
