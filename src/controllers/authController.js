const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    
    const user = await User.create({ name, email, password, phone });
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};
// src/controllers/authController.js में ये function add करें:

exports.logout = async (req, res) => {
  try {
    // In JWT, we typically handle logout on client side
    // But we can blacklist tokens or just send success response
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// Optional: Logout all devices (if using token blacklist)
exports.logoutAll = async (req, res) => {
  try {
    // Implement token blacklisting logic here
    // For now, just send success response
    
    res.json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};