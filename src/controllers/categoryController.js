// src/controllers/categoryController.js
const mongoose = require('mongoose');

function getCategoryModel() {
  // require dynamically at call-time to avoid circular dependencies / partial exports
  const mod = require('../models/Category');

  if (mod && typeof mod === 'function' && typeof mod.find === 'function') {
    return mod;
  } else if (mod && typeof mod === 'object') {
    if (mod.default && typeof mod.default.find === 'function') return mod.default;
    if (mod.Category && typeof mod.Category.find === 'function') return mod.Category;
    if (typeof mod.find === 'function') return mod;
  }
  // If still not proper, throw a clear error to help debugging
  throw new Error('Category model shape invalid. Keys: ' + (mod && Object.keys(mod) ? Object.keys(mod).join(',') : String(mod)));
}

// Helper: safe wrapper to catch model errors and return stub (optional)
function safeGetModel() {
  try {
    return getCategoryModel();
  } catch (e) {
    console.error('Model loader error:', e.message);
    // dev-stub fallback (keeps behavior non-crashing)
    return {
      find: (q = {}) => ({ sort: () => Promise.resolve([]) }),
      findOne: () => Promise.resolve(null),
      findById: () => Promise.resolve(null),
      findByIdAndUpdate: () => Promise.resolve(null),
      findByIdAndDelete: () => Promise.resolve(null),
      create: (d) => Promise.resolve({ _id: new mongoose.Types.ObjectId(), ...d, createdAt: new Date() }),
      insertMany: (a) => Promise.resolve(a.map(i => ({ _id: new mongoose.Types.ObjectId(), ...i })))
    };
  }
}

// ==============================
// GET ALL CATEGORIES
// ==============================
exports.getAllCategories = async (req, res) => {
  const Category = safeGetModel();
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, count: Array.isArray(categories) ? categories.length : 0, categories: Array.isArray(categories) ? categories : [], message: 'Categories fetched successfully' });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// GET CATEGORY BY ID
// ==============================
exports.getCategoryById = async (req, res) => {
  const Category = safeGetModel();
  console.log('GET BY ID called, id=', req.params.id);
  try {
    const category = await Category.findById(req.params.id);
    console.log('findById result:', !!category);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category });
  } catch (error) {
    console.error('Get category by ID error:', error);
    // If CastError due to invalid ObjectId, return 400
    if (error.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid ID format' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==============================
// CREATE CATEGORY
// ==============================
exports.createCategory = async (req, res) => {
  const Category = safeGetModel();
  try {
    const { name, description } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ success: false, message: 'Category name is required' });

    const exists = await Category.findOne({ name: name.trim() });
    if (exists) return res.status(400).json({ success: false, message: 'Category already exists' });

    const category = await Category.create({ name: name.trim(), description: description || '' });
    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Category name already exists' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==============================
// UPDATE CATEGORY
// ==============================
exports.updateCategory = async (req, res) => {
  const Category = safeGetModel();
  try {
    const { name, description } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ success: false, message: 'Category name is required' });

    const category = await Category.findByIdAndUpdate(req.params.id, { name: name.trim(), description: description || '' }, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category updated successfully', category });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==============================
// DELETE CATEGORY
// ==============================
exports.deleteCategory = async (req, res) => {
  const Category = safeGetModel();
  try {
    const deleted = await Category.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category deleted successfully', category: deleted });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==============================
// SEED DEFAULT CATEGORIES
// ==============================
exports.seedCategories = async (req, res) => {
  const Category = safeGetModel();
  try {
    const defaults = [
      { name: 'Sofa', description: 'All types of sofas and sofa sets' },
      { name: 'Bed', description: 'Beds, bed frames, and mattresses' },
      { name: 'Chair', description: 'Chairs, stools, and seating' },
      { name: 'Table', description: 'Tables, desks, and study tables' },
      { name: 'Wardrobe', description: 'Wardrobes, closets, and almirahs' }
    ];

    const existingNames = [];
    for (const item of defaults) {
      const exists = await Category.findOne({ name: item.name });
      if (exists) existingNames.push(item.name);
    }

    const toInsert = defaults.filter(item => !existingNames.includes(item.name));
    let inserted = [];
    if (toInsert.length > 0) inserted = await Category.insertMany(toInsert);

    res.json({ success: true, message: 'Default categories seeded', inserted: inserted.length, skipped: existingNames.length, existing: existingNames, newCategories: inserted });
  } catch (error) {
    console.error('Seed categories error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
// GET CATEGORY STATS
// ==============================
exports.getCategoryStats = async (req, res) => {
  const Category = safeGetModel();
  try {
    const categories = await Category.find();
    res.json({ success: true, totalCategories: Array.isArray(categories) ? categories.length : 0, categoriesList: Array.isArray(categories) ? categories.map(c => c.name) : [], message: 'Category statistics' });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
