// src/routes/barcodeRoutes.js में ये code डालें:

const express = require('express');
const router = express.Router();
const barcodeController = require('../controllers/barcodeController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Generate barcode
router.post('/generate', barcodeController.generateBarcode);

// Get barcode image
router.get('/:productCode', barcodeController.getBarcode);

// Generate base64 barcode (for frontend display)
router.post('/base64', barcodeController.generateBarcodeBase64);

// Bulk generate barcodes
router.post('/bulk', barcodeController.bulkGenerate);

// Print barcode labels
router.post('/print', (req, res) => {
  // Implement print functionality
  res.json({ 
    success: true, 
    message: 'Print functionality to be implemented' 
  });
});

module.exports = router;