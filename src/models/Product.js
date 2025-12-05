// src/models/Product.js में ये update करें:

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: { 
    type: String, 
    unique: true, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    required: true 
  },
  material: String,
  color: String,
  stock: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  costPrice: Number,
  
  // BARCODE FIELDS (Auto-generated)
  barcode: { 
    type: String, 
    unique: true 
  },
  barcodeImage: String,
  barcodeImageUrl: String,
  qrCodeImage: String,
  
  location: String,
  minStock: { 
    type: Number, 
    default: 5 
  },
  description: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);