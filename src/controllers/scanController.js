// src/controllers/scanController.js

const Product = require("../models/Product"); // Capital P
const Scan = require("../models/scan");       // 👈 Capital S (Scan.js file)

// Small helper – ObjectId valid hai ya nahi
const isValidObjectId = (id) =>
  typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);

// GET /api/scan/:code
exports.scanByCode = async (req, res) => {
  try {
    const code = req.params.code;

    const product = await Product.findOne({ code });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.json({ success: true, product });
  } catch (err) {
    console.error("Scan error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// GET /api/scan/recent?limit=10
exports.recentScans = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const logs = await Scan.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("productId", "name code");

    return res.json({ success: true, recent: logs });
  } catch (err) {
    console.error("Recent scan error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ⭐ NEW: GET /api/scan/history?from=YYYY-MM-DD&to=YYYY-MM-DD&code=FUR-001
exports.scanHistory = async (req, res) => {
  try {
    const { from, to, code } = req.query;

    const filter = {};

    if (code) {
      filter.code = code;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) {
        filter.createdAt.$gte = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999); // din ka end
        filter.createdAt.$lte = toDate;
      }
    }

    const logs = await Scan.find(filter)
      .sort({ createdAt: -1 })
      .populate("productId", "name code");

    return res.json({
      success: true,
      count: logs.length,
      history: logs,
    });
  } catch (err) {
    console.error("Scan history error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// POST /api/scan
exports.saveScan = async (req, res) => {
  try {
    const { code, productId, quantity, scanType, location, note } = req.body;

    if (!code) {
      return res
        .status(400)
        .json({ success: false, message: "Code is required" });
    }

    let finalProductId;

    // 1) Agar valid ObjectId aya hai to use hi le lo
    if (isValidObjectId(productId)) {
      finalProductId = productId;
    } else if (productId) {
      // invalid string aya hai
      console.warn("Ignoring invalid productId in scan:", productId);
    }

    // 2) Agar abhi bhi productId nahi hai to code se product dhoondo
    if (!finalProductId) {
      const product = await Product.findOne({ code });
      if (product) {
        finalProductId = product._id;
      }
    }

    const scan = await Scan.create({
      code,
      productId: finalProductId || undefined,
      quantity: quantity || 1,
      scanType: scanType || "audit",
      location,
      note,
    });

    return res.json({ success: true, scan });
  } catch (err) {
    console.error("Save scan error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
