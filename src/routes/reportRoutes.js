// src/routes/reportRoutes.js

const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const authMiddleware = require("../middleware/auth");

// saare reports protected rahenge
router.use(authMiddleware);

// FULL STOCK REPORT
// GET /api/reports/stock
router.get("/stock", reportController.getStockReport);

// 👇 IMPORTANT: yahi export hona chahiye
module.exports = router;
