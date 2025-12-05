// src/models/Scan.js

const mongoose = require("mongoose");

const scanSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: { type: Number, default: 1 },
    scanType: {
      type: String,
      enum: ["sale", "in", "audit"],
      default: "audit",
    },
    location: String,
    note: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Scan || mongoose.model("Scan", scanSchema);
