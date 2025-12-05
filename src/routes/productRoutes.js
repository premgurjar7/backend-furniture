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
router.get("/", safeHandler("getAllProducts"));

// 2. Get product by product code  (KEEP BEFORE :id)
router.get("/code/:code", safeHandler("getProductByCode"));

// 3. Search products
router.get("/search/:query", safeHandler("searchProducts"));

// 4. Get products by category
router.get("/category/:category", safeHandler("getProductsByCategory"));

// 5. Get low stock products
router.get("/low-stock/alerts", safeHandler("getLowStockProducts"));

// 6. Get single product by ID (generic – keep last in GETs)
router.get("/:id", safeHandler("getProductById"));

// 7. Create new product WITH AUTO CODE & BARCODE
router.post("/", safeHandler("createProduct"));

// 8. Update product
router.put("/:id", safeHandler("updateProduct"));

// 9. Delete product
router.delete("/:id", safeHandler("deleteProduct"));

// ========================
// BARCODE SPECIFIC APIs
// ========================

// 10. Generate barcode for existing product
router.post(
  "/:productId/generate-barcode",
  safeHandler("generateBarcodeForProduct")
);

// 11. Bulk generate barcodes
router.post("/bulk/generate-barcodes", safeHandler("bulkGenerateBarcodes"));

// ========================
// BULK OPERATION APIs
// ========================

// 12. Bulk create products
router.post("/bulk/create", safeHandler("bulkCreateProducts"));

module.exports = router;
