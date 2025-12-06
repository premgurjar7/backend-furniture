// src/routes/productRoutes.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authMiddleware = require("../middleware/auth");

// Small helper to avoid "callback undefined" crash
function safeHandler(fnName) {
  const fn = productController[fnName];

  return (req, res, next) => {
    if (typeof fn === "function") {
      return fn(req, res, next);
    }

    console.error(`❌ productController.${fnName} is undefined`);
    return res.status(500).json({
      success: false,
      message: `Handler ${fnName} is not implemented in productController`,
    });
  };
}

// ========================
// AUTH for all product APIs
// ========================
router.use(authMiddleware);

// ========================
// CORE PRODUCT CRUD APIs
// ========================

// 1. Get all products
// GET /api/products
router.get("/", safeHandler("getAllProducts"));

// 2. Get product by product code  (KEEP BEFORE :id)
// GET /api/products/code/FUR-001
router.get("/code/:code", safeHandler("getProductByCode"));

// (Scanner ke liye simple alias)
// GET /api/products/barcode/FUR-001
router.get("/barcode/:code", safeHandler("getProductByCode"));

// 3. Search products
// GET /api/products/search/sofa
router.get("/search/:query", safeHandler("searchProducts"));

// 4. Get products by category
// GET /api/products/category/Sofa
router.get("/category/:category", safeHandler("getProductsByCategory"));

// 5. Get low stock products
// GET /api/products/low-stock?threshold=5
router.get("/low-stock", safeHandler("getLowStockProducts"));

// (optional alias – UI me alerts tab ke liye)
// GET /api/products/low-stock/alerts?threshold=5
router.get("/low-stock/alerts", safeHandler("getLowStockProducts"));

// 6. Get single product by ID (generic – keep LAST in GETs)
// GET /api/products/676abc123
router.get("/:id", safeHandler("getProductById"));

// ========================
// STOCK UPDATE API
// ========================

// 7. Update only stock of a product
// PATCH /api/products/:id/stock
router.patch("/:id/stock", safeHandler("updateProductStock"));

// ========================
// CREATE / UPDATE / DELETE
// ========================

// 8. Create new product
// POST /api/products
router.post("/", safeHandler("createProduct"));

// 9. Update product
// PUT /api/products/676abc123
router.put("/:id", safeHandler("updateProduct"));

// 10. Delete product
// DELETE /api/products/676abc123
router.delete("/:id", safeHandler("deleteProduct"));

// ========================
// BARCODE SPECIFIC APIs
// ========================

// 11. Generate barcode for existing product
// POST /api/products/:productId/generate-barcode
router.post(
  "/:productId/generate-barcode",
  safeHandler("generateBarcodeForProduct")
);

// 12. Bulk generate barcodes
// POST /api/products/bulk/generate-barcodes
router.post("/bulk/generate-barcodes", safeHandler("bulkGenerateBarcodes"));

// ========================
// BULK OPERATION APIs
// ========================

// 13. Bulk create products
// POST /api/products/bulk/create
router.post("/bulk/create", safeHandler("bulkCreateProducts"));

module.exports = router;
