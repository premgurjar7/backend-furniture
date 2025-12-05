// src/services/productService.js - नई file create करें:

const Product = require('../models/Product');
const barcodeService = require('./barcodeService');

class ProductService {
  async generateProductCode() {
    try {
      // Find the last product code
      const lastProduct = await Product.findOne(
        { productCode: { $regex: /^FUR-\d+$/ } },
        { productCode: 1 },
        { sort: { createdAt: -1 } }
      );
      
      let nextNumber = 1;
      if (lastProduct && lastProduct.productCode) {
        const match = lastProduct.productCode.match(/FUR-(\d+)/);
        if (match && match[1]) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      
      return `FUR-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      // Fallback: use timestamp
      const timestamp = Date.now().toString().slice(-6);
      return `FUR-${timestamp}`;
    }
  }

  async createProductWithBarcode(productData) {
    try {
      // Step 1: Generate product code
      const productCode = await this.generateProductCode();
      
      // Step 2: Generate barcode
      const barcodeData = await barcodeService.generateBarcode(
        productCode, 
        productData.name
      );
      
      // Step 3: Create product with both code and barcode
      const product = await Product.create({
        ...productData,
        productCode: productCode,
        barcode: barcodeData.barcode,
        barcodeImage: barcodeData.barcodeImage,
        barcodeImageUrl: barcodeData.barcodeImageUrl
      });
      
      return {
        success: true,
        product: product,
        barcode: barcodeData
      };
      
    } catch (error) {
      console.error('Create product with barcode error:', error);
      throw error;
    }
  }

  async updateProductBarcode(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      
      const barcodeData = await barcodeService.generateBarcode(
        product.productCode,
        product.name
      );
      
      product.barcode = barcodeData.barcode;
      product.barcodeImage = barcodeData.barcodeImage;
      product.barcodeImageUrl = barcodeData.barcodeImageUrl;
      
      await product.save();
      
      return barcodeData;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProductService();