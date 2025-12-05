// src/models/Product.js

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // 👇 IMPORTANT CHANGE: ab String, ObjectId nahi
    category: {
      type: String,   // e.g. "Sofa", "Bed", "Chair"
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
