// const express = require('express');
// const router = express.Router();
// const adminController = require('../controllers/adminController');
// const { authenticateToken, requireAdmin } = require('../middleware/auth');

// // All routes require authentication and admin privileges
// router.use(authenticateToken);
// router.use(requireAdmin);

// // Dashboard statistics
// router.get('/dashboard', adminController.getDashboardStats);

// // User management
// router.get('/users', adminController.getUsers);
// router.get('/users/:userId', adminController.getUserDetails);
// router.put('/users/:userId', adminController.updateUser);
// router.delete('/users/:userId', adminController.deleteUser);

// // Analytics
// router.get('/analytics', adminController.getAnalytics);

// module.exports = router;