// src/services/barcodeService.js - नई file create करें:

const bwipjs = require('bwip-js');
const fs = require('fs');
const path = require('path');

class BarcodeService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '..', 'uploads', 'barcodes');
    this.ensureUploadsDirectory();
  }

  ensureUploadsDirectory() {
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async generateBarcode(productCode, productName = '') {
    try {
      const barcodePath = path.join(this.uploadsDir, `${productCode}.png`);
      
      // Generate barcode image
      const pngBuffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text: productCode,
        scale: 3,
        height: 15,
        includetext: true,
        textxalign: 'center',
        textsize: 13,
        alttext: productName.substring(0, 20) || productCode
      });

      // Save to file
      fs.writeFileSync(barcodePath, pngBuffer);
      
      // Return barcode data
      return {
        barcode: productCode,
        barcodeImage: `/uploads/barcodes/${productCode}.png`,
        barcodeImageUrl: `http://localhost:${process.env.PORT || 5000}/uploads/barcodes/${productCode}.png`,
        barcodePath: barcodePath
      };
      
    } catch (error) {
      console.error('Barcode generation error:', error);
      throw new Error(`Barcode generation failed: ${error.message}`);
    }
  }

  async generateBarcodeBase64(productCode) {
    try {
      const pngBuffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text: productCode,
        scale: 3,
        height: 15,
        includetext: true
      });

      return `data:image/png;base64,${pngBuffer.toString('base64')}`;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BarcodeService();