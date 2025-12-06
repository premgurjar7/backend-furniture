// src/controllers/reportController.js

const Product = require("../models/Product");
const Scan = require("../models/scan");

// =======================
// STOCK REPORT
// GET /api/reports/stock
// =======================
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

// =======================
// SALES REPORT (Option E)
// GET /api/reports/sales
// =======================
exports.getSalesReport = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const { from, to } = req.query;

    // sirf SALE scans ka data
    const scanFilter = { scanType: "sale" };

    if (from || to) {
      scanFilter.createdAt = {};
      if (from) scanFilter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        scanFilter.createdAt.$lte = toDate;
      }
    }

    // Recent sale scans (detailed list)
    const recentSales = await Scan.find(scanFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("productId", "name code category salePrice");

    // Total summary (items + amount)
    let totalQtySold = 0;
    let totalSalesAmount = 0;

    for (const s of recentSales) {
      const qty = Number(s.quantity) || 0;
      totalQtySold += qty;

      const price = s.productId ? Number(s.productId.salePrice) || 0 : 0;
      totalSalesAmount += qty * price;
    }

    // Aggregate by code for full range
    const salesAgg = await Scan.aggregate([
      { $match: scanFilter },
      {
        $group: {
          _id: "$code",
          totalQty: { $sum: "$quantity" },
          scansCount: { $sum: 1 },
        },
      },
      { $sort: { totalQty: -1 } },
    ]);

    const allCodes = salesAgg.map((s) => s._id);
    const productsByCode = await Product.find({ code: { $in: allCodes } }).lean();
    const productMap = new Map(productsByCode.map((p) => [p.code, p]));

    // Top selling products
    const topSellingProducts = salesAgg.slice(0, limit).map((s) => {
      const p = productMap.get(s._id);
      const price = p ? Number(p.salePrice) || 0 : 0;
      return {
        code: s._id,
        totalQty: s.totalQty,
        scansCount: s.scansCount,
        totalAmount: s.totalQty * price,
        product: p
          ? {
              _id: p._id,
              name: p.name,
              category: p.category,
              salePrice: p.salePrice,
            }
          : null,
      };
    });

    // Category-wise sales
    const salesByCategoryMap = new Map();
    for (const s of salesAgg) {
      const p = productMap.get(s._id);
      const category = p?.category || "Uncategorized";
      const price = p ? Number(p.salePrice) || 0 : 0;
      const amount = s.totalQty * price;

      if (!salesByCategoryMap.has(category)) {
        salesByCategoryMap.set(category, {
          category,
          totalQtySold: 0,
          totalSalesAmount: 0,
          productsCount: 0,
        });
      }

      const bucket = salesByCategoryMap.get(category);
      bucket.totalQtySold += s.totalQty;
      bucket.totalSalesAmount += amount;
      bucket.productsCount += 1;
    }

    const salesByCategory = Array.from(salesByCategoryMap.values());

    // Daily breakdown (date-wise)
    const allSaleScans = await Scan.find(scanFilter).populate(
      "productId",
      "salePrice"
    );

    const dailyMap = new Map();
    for (const s of allSaleScans) {
      const d = new Date(s.createdAt);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD

      if (!dailyMap.has(key)) {
        dailyMap.set(key, {
          date: key,
          totalQtySold: 0,
          totalSalesAmount: 0,
          salesCount: 0,
        });
      }

      const qty = Number(s.quantity) || 0;
      const price = s.productId ? Number(s.productId.salePrice) || 0 : 0;
      const amount = qty * price;

      const bucket = dailyMap.get(key);
      bucket.totalQtySold += qty;
      bucket.totalSalesAmount += amount;
      bucket.salesCount += 1;
    }

    const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return res.json({
      success: true,
      generatedAt: new Date(),
      filters: { from: from || null, to: to || null, limit },
      summary: {
        totalQtySold,
        totalSalesAmount,
        totalProductsSold: salesAgg.length,
      },
      topSellingProducts,
      salesByCategory,
      dailyBreakdown,
      recentSales,
    });
  } catch (err) {
    console.error("getSalesReport error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
