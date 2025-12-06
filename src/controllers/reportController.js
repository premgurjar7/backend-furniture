// src/controllers/reportController.js

const Product = require("../models/Product");
const Scan = require("../models/scan");

// GET /api/reports/stock
// Query params (optional):
//   lowThreshold = low stock limit (default 5)
//   limit        = list me top kitne show kare (default 10)
//   from, to     = scans analysis ke liye date range (YYYY-MM-DD)
exports.getStockReport = async (req, res) => {
  try {
    const lowThreshold = Number(req.query.lowThreshold) || 5;
    const limit = Number(req.query.limit) || 10;
    const { from, to } = req.query;

    // 1) Saare products laao
    const products = await Product.find({}).sort({ name: 1 });

    const totalProducts = products.length;
    let totalStockQty = 0;

    const lowStockProducts = [];
    const outOfStockProducts = [];

    // category wise map
    const categoryMap = new Map();

    for (const p of products) {
      const stock = Number(p.stock) || 0;
      totalStockQty += stock;

      if (stock <= 0) {
        outOfStockProducts.push(p);
      } else if (stock <= lowThreshold) {
        lowStockProducts.push(p);
      }

      const cat = p.category || "Uncategorized";

      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, {
          category: cat,
          totalProducts: 0,
          totalStockQty: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          items: [],
        });
      }

      const bucket = categoryMap.get(cat);
      bucket.totalProducts += 1;
      bucket.totalStockQty += stock;
      if (stock <= 0) bucket.outOfStockCount += 1;
      else if (stock <= lowThreshold) bucket.lowStockCount += 1;

      bucket.items.push({
        _id: p._id,
        name: p.name,
        code: p.code,
        stock,
      });
    }

    // Top lists
    const topLowStock = [...lowStockProducts]
      .sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0))
      .slice(0, limit)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        code: p.code,
        category: p.category,
        stock: Number(p.stock) || 0,
      }));

    const topHighStock = [...products]
      .sort((a, b) => (Number(b.stock) || 0) - (Number(a.stock) || 0))
      .slice(0, limit)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        code: p.code,
        category: p.category,
        stock: Number(p.stock) || 0,
      }));

    const byCategory = Array.from(categoryMap.values());

    // 2) Scan data – recent + most scanned
    const scanFilter = {};
    if (from || to) {
      scanFilter.createdAt = {};
      if (from) scanFilter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        scanFilter.createdAt.$lte = toDate;
      }
    }

    // recent scans
    const recentScans = await Scan.find(scanFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("productId", "name code category stock");

    // most scanned (aggregate by code)
    const mostScannedAgg = await Scan.aggregate([
      { $match: scanFilter },
      {
        $group: {
          _id: "$code",
          totalQty: { $sum: "$quantity" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: limit },
    ]);

    // enrich mostScanned with product info
    const codes = mostScannedAgg.map((s) => s._id);
    const productsByCode = await Product.find({ code: { $in: codes } }).lean();

    const productMap = new Map(productsByCode.map((p) => [p.code, p]));

    const mostScanned = mostScannedAgg.map((s) => {
      const p = productMap.get(s._id);
      return {
        code: s._id,
        totalQty: s.totalQty,
        scansCount: s.count,
        product: p
          ? {
              _id: p._id,
              name: p.name,
              category: p.category,
              stock: p.stock,
            }
          : null,
      };
    });

    return res.json({
      success: true,
      generatedAt: new Date(),
      summary: {
        totalProducts,
        totalStockQty,
        lowThreshold,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
      },
      topLowStock,
      topHighStock,
      byCategory,
      scans: {
        filters: { from: from || null, to: to || null },
        recentScans,
        mostScanned,
      },
    });
  } catch (err) {
    console.error("getStockReport error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
