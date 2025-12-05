const Product = require("../models/Product");

exports.scanProduct = async (req, res) => {
  try {
    const { barcode, scannerId, action, quantity, notes } = req.body;

    if (!barcode) {
      return res.status(400).json({ success: false, message: "Barcode is required" });
    }

    // Find product by barcode (this must exist in your Product model)
    const product = await Product.findOne({ barcode: barcode });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found for this barcode" });
    }

    // Perform stock update
    if (action === "sale") {
      if (product.stock < quantity) {
        return res.status(400).json({ success: false, message: "Not enough stock" });
      }
      product.stock -= quantity;
    } else if (action === "add") {
      product.stock += quantity;
    }

    await product.save();

    // Response
    return res.status(200).json({
      success: true,
      message: "Scan recorded successfully",
      product: {
        name: product.name,
        barcode: product.barcode,
        stock: product.stock
      },
      scanned: {
        scannerId,
        quantity,
        action,
        notes,
        time: new Date()
      }
    });

  } catch (error) {
    console.error("Scan error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
