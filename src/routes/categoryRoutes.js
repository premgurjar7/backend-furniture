// src/routes/categoryRoutes.js

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');

// =============================
// FIXED ORDER
// =============================

// Seed route MUST be above ID routes
router.post('/seed/default', authMiddleware, categoryController.seedCategories);

// Public Routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected Routes
router.post('/', authMiddleware, categoryController.createCategory);
router.put('/:id', authMiddleware, categoryController.updateCategory);
router.delete('/:id', authMiddleware, categoryController.deleteCategory);

module.exports = router;
