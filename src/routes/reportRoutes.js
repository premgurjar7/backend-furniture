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

// FULL SALES REPORT (Option E)
// GET /api/reports/sales
router.get("/sales", reportController.getSalesReport);

module.exports = router;
