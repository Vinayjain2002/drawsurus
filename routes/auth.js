const express= require("express")
const router= express.Router();
const rateLimit= require("express-rate-limit");
const { authenticateToken, authRateLimit } = require('../middleware/auth');
const authController = require("../controllers/authController");

const authLimiter= rateLimit(authRateLimit);

// defining the routes
router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/logout", authenticateToken, authController.logout);

router.post("/refresh", authenticateToken, authController.refreshToken);
router.post("/profile", authenticateToken, authController.refreshToken);
router.get("/profile", authenticateToken, authController.getProfile);
router.put("/progile", authenticateToken, authController.updateProfile);

module.exports= router;