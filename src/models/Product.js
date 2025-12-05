// src/models/Product.js

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: String,
    code: { type: String, unique: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    purchasePrice: Number,
    salePrice: Number,
    stock: Number,
    unit: String,
    location: String,
    description: String,
    gstPercent: Number,
  },
  { timestamps: true }
);

// SAFE EXPORT → OverwriteModelError FIXED
module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
