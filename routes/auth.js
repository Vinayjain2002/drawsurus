const express= require("express")
const router= express.Router();
const rateLimit= require("express-rate-limit");
const { authenticateToken, authRateLimit } = require('../middleware/auth');
const authController = require("../controllers/authController");

const authLimiter= rateLimit(authRateLimit);

router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/logout", authenticateToken, authController.logout);

router.post("/refresh", authenticateToken, authController.refreshToken);
router.post("/profile", authenticateToken, authController.updateProfile);
router.get("/profile", authenticateToken, authController.getProfile);

module.exports= router;