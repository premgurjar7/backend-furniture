// src/controllers/barcodeController.js में ये code डालें:

const Product = require('../models/Product');
const { generateBarcode, generateBarcodeBase64 } = require('../utils/barcodeGenerator');

// Generate barcode for product
exports.generateBarcode = async (req, res) => {
  try {
    const { productId, productCode, type = 'code128' } = req.body;

    let product;
    let codeToEncode;

    // Find product by ID or code
    if (productId) {
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: 'Product not found' 
        });
      }
      codeToEncode = product.productCode;
    } else if (productCode) {
      product = await Product.findOne({ productCode });
      codeToEncode = productCode;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Provide either productId or productCode' 
      });
    }

    // Generate barcode
    const barcodeResult = await generateBarcode(
      codeToEncode, 
      product ? product.name : ''
    );

    // If product exists, update with barcode info
    if (product) {
      product.barcode = codeToEncode;
      product.barcodeImage = barcodeResult.barcodeImage;
      await product.save();
    }

    res.json({
      success: true,
      message: 'Barcode generated successfully',
      data: {
        productId: product?._id,
        productCode: codeToEncode,
        productName: product?.name,
        barcode: codeToEncode,
        barcodeImage: barcodeResult.barcodeImage,
        barcodeImageUrl: `http://localhost:${process.env.PORT}${barcodeResult.barcodeImage}`,
        downloadUrl: `http://localhost:${process.env.PORT}/api/barcode/download/${codeToEncode}`
      }
    });

  } catch (error) {
    console.error('Barcode generation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Get barcode image
exports.getBarcode = async (req, res) => {
  try {
    const { productCode } = req.params;
    
    const barcodePath = path.join(
      __dirname, 
      '..', 
      'uploads', 
      'barcodes', 
      `${productCode}.png`
    );

    if (!fs.existsSync(barcodePath)) {
      // Generate if doesn't exist
      await generateBarcode(productCode);
    }

    res.sendFile(barcodePath);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Generate barcode as base64 (for immediate display in frontend)
exports.generateBarcodeBase64 = async (req, res) => {
  try {
    const { productCode } = req.body;
    
    if (!productCode) {
      return res.status(400).json({ 
        success: false, 
        message: 'productCode is required' 
      });
    }

    const base64Image = await generateBarcodeBase64(productCode);
    
    res.json({
      success: true,
      data: {
        productCode,
        barcodeImage: base64Image
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Bulk generate barcodes
exports.bulkGenerate = async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'productIds array is required' 
      });
    }

    const results = [];
    
    for (const productId of productIds) {
      try {
        const product = await Product.findById(productId);
        if (product) {
          const barcodeResult = await generateBarcode(
            product.productCode, 
            product.name
          );
          
          product.barcode = product.productCode;
          product.barcodeImage = barcodeResult.barcodeImage;
          await product.save();
          
          results.push({
            productId: product._id,
            productCode: product.productCode,
            success: true,
            barcodeImage: barcodeResult.barcodeImage
          });
        }
      } catch (err) {
        results.push({
          productId,
          success: false,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: `Generated ${results.filter(r => r.success).length} barcodes`,
      results
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};