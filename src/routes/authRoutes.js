const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.getProfile);
// src/routes/authRoutes.js में logout route add करें:

router.post('/logout', authMiddleware, authController.logout);
router.post('/logout-all', authMiddleware, authController.logoutAll);
module.exports = router;
