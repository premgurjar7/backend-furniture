// src/controllers/productController.js

const Product = require("../models/Product");

// =======================
// 1. Get all products
// GET /api/products
// Query: page, limit, q (search), category
// =======================
exports.getAllProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.q) {
      const q = req.query.q.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
      ];
    }

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const [items, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      page,
      limit,
      total,
      items,
    });
  } catch (err) {
    console.error("getAllProducts error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =======================
// 2. Get product by CODE
// GET /api/products/code/:code
// =======================
exports.getProductByCode = async (req, res) => {
  try {
    const code = req.params.code.trim();
    const product = await Product.findOne({ code });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.json({ success: true, product });
  } catch (err) {
    console.error("getProductByCode error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =======================
// 3. Search products
// GET /api/products/search/:query
// =======================
exports.searchProducts = async (req, res) => {
  try {
    const q = (req.params.query || "").trim();
    if (!q) {
      return res.json({ success: true, items: [] });
    }

    const items = await Product.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { code: { $regex: q, $options: "i" } },
      ],
    }).limit(50);

    return res.json({ success: true, items });
  } catch (err) {
    console.error("searchProducts error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =======================
// 4. Get products by category (string)
// GET /api/products/category/:category
// =======================
exports.getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category.trim();
    const items = await Product.find({ category }).sort({ name: 1 });

    return res.json({ success: true, items });
  } catch (err) {
    console.error("getProductsByCategory error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =======================
// 5. Low stock products
// GET /api/products/low-stock?threshold=5
// =======================
exports.getLowStockProducts = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 5;

    const products = await Product.find({
      stock: { $lte: threshold },
    }).sort({ stock: 1 });

    return res.json({
      success: true,
      threshold,
      count: products.length,
      products,
    });
  } catch (err) {
    console.error("getLowStockProducts error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =======================
// 6. Get product by ID
// GET /api/products/:id
// =======================
exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.json({ success: true, product });
  } catch (err) {
    console.error("getProductById error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =======================
// 7. Create product
// POST /api/products
// =======================
// =======================
// 7. Create product
// POST /api/products
// =======================
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      code,
      category,
      purchasePrice,
      salePrice,
      stock,
      unit,
      location,
      description,
      gstPercent,
    } = req.body;

    if (!name || !code || !category) {
      return res.status(400).json({
        success: false,
        message: "name, code & category are required",
      });
    }

    // duplicate check existing
    const existing = await Product.findOne({ code });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Product code already exists",
      });
    }

    // 👇 YAHI MAIN FIX HAI: productCode ko bhi fill karo
    const product = await Product.create({
      productCode: code,  // index ke liye kabhi null nahi rahega
      name,
      code,
      category,
      purchasePrice,
      salePrice,
      stock,
      unit,
      location,
      description,
      gstPercent,
    });

    return res.status(201).json({ success: true, product });
  } catch (err) {
    console.error("createProduct error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


// =======================
// 8. Update product
// PUT /api/products/:id
// =======================
exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.json({ success: true, product });
  } catch (err) {
    console.error("updateProduct error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =======================
// 9. Delete product
// DELETE /api/products/:id
// =======================
exports.deleteProduct = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =======================
// 10. Generate barcode for a product
// POST /api/products/:productId/generate-barcode
// =======================
exports.generateBarcodeForProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    return res.json({
      success: true,
      message: "Barcode generation placeholder (implement later)",
      productId,
    });
  } catch (err) {
    console.error("generateBarcodeForProduct error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =======================
// 11. Bulk generate barcodes (placeholder)
// POST /api/products/bulk/generate-barcodes
// =======================
exports.bulkGenerateBarcodes = async (req, res) => {
  try {
    return res.json({
      success: true,
      message: "Bulk barcode generation placeholder (implement later)",
    });
  } catch (err) {
    console.error("bulkGenerateBarcodes error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =======================
// 12. Bulk create products
// POST /api/products/bulk/create
// =======================
exports.bulkCreateProducts = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];

    if (!items.length) {
      return res.status(400).json({
        success: false,
        message: "Array of products required",
      });
    }

    const created = await Product.insertMany(items);

    return res.json({
      success: true,
      count: created.length,
      items: created,
    });
  } catch (err) {
    console.error("bulkCreateProducts error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// =======================
// 13. Update ONLY stock of a product
// PATCH /api/products/:id/stock
// Body: { "change": -1, "reason": "sale", "note": "Scanned at counter" }
// =======================
exports.updateProductStock = async (req, res) => {
  try {
    const id = req.params.id;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const { change, reason, note } = req.body;
    const changeNumber = Number(change);

    if (Number.isNaN(changeNumber) || changeNumber === 0) {
      return res.status(400).json({
        success: false,
        message: "Valid non-zero numeric 'change' is required",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const currentStock = Number(product.stock) || 0;
    const newStock = currentStock + changeNumber;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    product.stock = newStock;

    // Optional: stock history array agar schema me ho
    if (Array.isArray(product.stockHistory)) {
      product.stockHistory.push({
        change: changeNumber,
        reason: reason || "adjustment",
        note: note || "",
        date: new Date(),
      });
    }

    await product.save();

    return res.json({
      success: true,
      message: "Stock updated",
      stock: product.stock,
      product,
    });
  } catch (err) {
    console.error("updateProductStock error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
