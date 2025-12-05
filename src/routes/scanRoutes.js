const express = require("express");
const router = express.Router();
const scanController = require("../controllers/scanController");

// Scan by code
router.get("/:code", scanController.scanByCode);

// Recent scans
router.get("/recent/list", scanController.recentScans);

// Save scan history
router.post("/", scanController.saveScan);

module.exports = router;
