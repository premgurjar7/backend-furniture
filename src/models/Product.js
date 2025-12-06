// src/models/Product.js

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // unique technical code jo DB/index ke liye use hoga
    productCode: {
      type: String,
      unique: true,      // yahi index ka naam productCode_1 hai
      sparse: true,      // null values ko ignore karega
      trim: true,
    },

    // display / app ke liye code (same rakh sakte ho)
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // simple string category (Sofa, Bed, Chair etc.)
    category: {
      type: String,
      required: true,
      trim: true,
    },

    purchasePrice: {
      type: Number,
      default: 0,
    },
    salePrice: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: "pcs",
    },
    location: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    gstPercent: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// SAFE EXPORT → OverwriteModelError fix
module.exports =
  mongoose.models.Product || mongoose.model("Product", productSchema);
