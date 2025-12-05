// src/controllers/productController.js

const Product = require('../models/Product');
const { generateBarcode, generateBarcodeBase64 } = require('../utils/barcodeGenerator');

// Helper: Generate product code
const generateProductCode = async () => {
  try {
    // Get the last product
    const lastProduct = await Product.findOne(
      { productCode: { $regex: /^FUR-\d+$/ } },
      {},
      { sort: { createdAt: -1 } }
    );
    
    let nextNumber = 1;
    if (lastProduct && lastProduct.productCode) {
      const match = lastProduct.productCode.match(/FUR-(\d+)/);
      if (match && match[1]) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    // Check if code already exists
    let productCode = `FUR-${nextNumber.toString().padStart(3, '0')}`;
    let exists = await Product.findOne({ productCode });
    let counter = 1;
    
    // Find unique code
    while (exists) {
      productCode = `FUR-${(nextNumber + counter).toString().padStart(3, '0')}`;
      exists = await Product.findOne({ productCode });
      counter++;
    }
    
    return productCode;
  } catch (error) {
    console.error('Product code generation error:', error);
    // Fallback: timestamp based
    const timestamp = Date.now().toString().slice(-6);
    return `FUR-T${timestamp}`;
  }
};

// Helper: Generate barcode for product
const generateProductBarcode = async (productCode, productName) => {
  try {
    console.log(`🔄 Starting barcode generation for ${productCode}`);
    
    const barcodeResult = await generateBarcode(productCode, productName);
    
    console.log(`📊 Barcode result:`, barcodeResult);
    
    // Construct full URL
    const port = process.env.PORT || 5000;
    const barcodeImageUrl = barcodeResult.barcodeImage 
      ? `http://localhost:${port}${barcodeResult.barcodeImage}`
      : null;
    
    return {
      barcode: productCode,
      barcodeImage: barcodeResult.barcodeImage,
      barcodeImageUrl: barcodeImageUrl,
      generationSuccess: barcodeResult.success
    };
  } catch (error) {
    console.error('❌ Barcode generation failed:', error);
    // Return basic barcode info even if image fails
    return {
      barcode: productCode,
      barcodeImage: `/uploads/barcodes/${productCode}.png`,
      barcodeImageUrl: null,
      generationSuccess: false,
      error: error.message
    };
  }
};

// ✅ 1. GET ALL PRODUCTS
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: products.length,
      products: products.map(product => ({
        _id: product._id,
        productCode: product.productCode,
        name: product.name,
        category: product.category,
        material: product.material,
        color: product.color,
        stock: product.stock,
        price: product.price,
        costPrice: product.costPrice,
        barcode: product.barcode,
        barcodeImage: product.barcodeImage,
        location: product.location,
        minStock: product.minStock,
        description: product.description,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      }))
    });
    
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ✅ 2. GET PRODUCT BY ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      product: product
    });
    
  } catch (error) {
    console.error('Get product by ID error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ✅ 3. GET PRODUCT BY CODE
exports.getProductByCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    const product = await Product.findOne({ productCode: code });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      product: product
    });
    
  } catch (error) {
    console.error('Get product by code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ✅ 4. CREATE PRODUCT WITH AUTO CODE & BARCODE
exports.createProduct = async (req, res) => {
  try {
    console.log('🆕 Creating new product...');
    const productData = req.body;
    
    // Step 1: Generate product code
    const productCode = await generateProductCode();
    console.log(`✅ Generated product code: ${productCode}`);
    
    // Step 2: Generate barcode
    console.log(`🔄 Generating barcode for ${productCode}...`);
    const barcodeData = await generateProductBarcode(productCode, productData.name);
    console.log(`📊 Barcode data:`, barcodeData);
    
    // Step 3: Create product with both
    console.log(`💾 Saving product to database...`);
    const product = await Product.create({
      ...productData,
      productCode: productCode,
      barcode: barcodeData.barcode,
      barcodeImage: barcodeData.barcodeImage
    });
    
    console.log(`✅ Product saved: ${product._id}`);
    
    // Step 4: Prepare response
    const responseData = {
      _id: product._id,
      productCode: product.productCode,
      name: product.name,
      category: product.category,
      material: product.material,
      color: product.color,
      stock: product.stock,
      price: product.price,
      costPrice: product.costPrice || null,
      barcode: product.barcode,
      barcodeImage: product.barcodeImage,
      location: product.location || null,
      minStock: product.minStock || 5,
      description: product.description || null,
      createdAt: product.createdAt
    };
    
    // Add barcodeImageUrl only if available
    if (barcodeData.barcodeImageUrl) {
      responseData.barcodeImageUrl = barcodeData.barcodeImageUrl;
    }
    
    console.log(`📤 Sending response...`);
    
    res.status(201).json({
      success: true,
      message: barcodeData.generationSuccess 
        ? 'Product created successfully with barcode' 
        : 'Product created but barcode image generation failed',
      data: responseData,
      barcodeGenerated: barcodeData.generationSuccess
    });
    
  } catch (error) {
    console.error('❌ Create product error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create product'
    });
  }
};

// ✅ 5. UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.productCode;
    delete updateData.barcode;
    delete updateData.barcodeImage;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    const product = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product: product
    });
    
  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update product'
    });
  }
};

// ✅ 6. DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
      product: {
        _id: product._id,
        productCode: product.productCode,
        name: product.name
      }
    });
    
  } catch (error) {
    console.error('Delete product error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ✅ 7. SEARCH PRODUCTS
exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.params;
    
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { productCode: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { material: { $regex: query, $options: 'i' } },
        { color: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: products.length,
      products: products
    });
    
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ✅ 8. GET PRODUCTS BY CATEGORY
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const products = await Product.find({ 
      category: { $regex: new RegExp(`^${category}$`, 'i') } 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: products.length,
      category: category,
      products: products
    });
    
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ✅ 9. GET LOW STOCK PRODUCTS
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$stock', '$minStock'] }
    }).sort({ stock: 1 });
    
    res.json({
      success: true,
      count: products.length,
      products: products
    });
    
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = exports;