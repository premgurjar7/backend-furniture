// src/utils/barcodeGenerator.js

const bwipjs = require('bwip-js');
const fs = require('fs');
const path = require('path');

const generateBarcode = async (productCode, productName = '') => {
  try {
    console.log(`🔹 Generating barcode for: ${productCode}`);
    
    // Get the root directory (backend folder)
    const rootDir = path.join(__dirname, '..', '..');
    const uploadsDir = path.join(rootDir, 'uploads', 'barcodes');
    
    console.log(`📁 Uploads directory: ${uploadsDir}`);
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      console.log(`📁 Creating directory: ${uploadsDir}`);
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const barcodePath = path.join(uploadsDir, `${productCode}.png`);
    console.log(`💾 Barcode will be saved to: ${barcodePath}`);
    
    // Generate barcode
    console.log('🎨 Generating barcode image...');
    const pngBuffer = await bwipjs.toBuffer({
      bcid: 'code128',       // Barcode type
      text: productCode,     // Text to encode
      scale: 3,              // 3x scaling factor
      height: 15,            // Bar height, in millimeters
      includetext: true,     // Show human-readable text
      textxalign: 'center',  // Text alignment
      textsize: 13,          // Text size
      textyoffset: 5,        // Text vertical offset
      paddingwidth: 10,      // Padding
      paddingheight: 10,
      alttext: productName.substring(0, 20) || productCode
    });

    console.log('💾 Saving barcode image...');
    // Save to file
    fs.writeFileSync(barcodePath, pngBuffer);
    
    // Return file path and URL
    const barcodeImage = `/uploads/barcodes/${productCode}.png`;
    
    console.log(`✅ Barcode generated successfully: ${barcodeImage}`);
    
    return {
      success: true,
      barcodeData: productCode,
      barcodeImage: barcodeImage,
      barcodePath: barcodePath
    };
    
  } catch (error) {
    console.error('❌ Barcode generation error:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return basic info even if image generation fails
    return {
      success: false,
      barcodeData: productCode,
      barcodeImage: `/uploads/barcodes/${productCode}.png`, // Still return the expected path
      error: error.message
    };
  }
};

const generateBarcodeBase64 = async (productCode) => {
  try {
    const pngBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: productCode,
      scale: 3,
      height: 15,
      includetext: true,
      textxalign: 'center'
    });

    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Base64 barcode error:', error);
    throw error;
  }
};

module.exports = {
  generateBarcode,
  generateBarcodeBase64
};