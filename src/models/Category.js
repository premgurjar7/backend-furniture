// src/models/Category.js - CORRECT VERSION:

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// ✅ CRITICAL: Export correctly
const Category = mongoose.model('Category', categorySchema);
module.exports = Category;