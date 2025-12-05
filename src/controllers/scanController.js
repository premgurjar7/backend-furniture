// src/controllers/scanController.js

const Product = require("../models/Product"); // Capital P
const Scan = require("../models/scan");

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

// POST /api/scan
exports.saveScan = async (req, res) => {
  try {
    const { code, productId, quantity, scanType, location, note } = req.body;

    if (!code)
      return res
        .status(400)
        .json({ success: false, message: "Code is required" });

    let finalProductId = productId;

    if (!finalProductId) {
      const product = await Product.findOne({ code });
      if (product) finalProductId = product._id;
    }

    const scan = await Scan.create({
      code,
      productId: finalProductId,
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
