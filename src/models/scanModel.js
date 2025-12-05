const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema({
  code: { type: String, required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: { type: Number, default: 1 },
  scanType: { type: String, enum: ["sale", "in", "audit"], default: "audit" },
  note: String
}, { timestamps: true });

module.exports = mongoose.model("Scan", scanSchema);
