const Product = require("../models/productModel");
const Scan = require("../models/scanModel");

// GET /api/scan/:code
exports.scanByCode = async (req, res) => {
  try {
    const code = req.params.code;
    const product = await Product.findOne({ code });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.json({
      success: true,
      product
    });

  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/scan/recent/list
exports.recentScans = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const logs = await Scan.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("productId", "name code");

    return res.json({
      success: true,
      recent: logs
    });

  } catch (err) {
    console.error("Recent scan error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/scan
exports.saveScan = async (req, res) => {
  try {
    const scan = await Scan.create(req.body);

    return res.json({
      success: true,
      scan
    });

  } catch (err) {
    console.error("Save scan error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
