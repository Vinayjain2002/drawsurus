const express= require('express')
const router= express.Router();
const AdminController= require("../controllers/adminController");
const {authenticateToken, requireAdmin}= require("../middleware/auth.js");

router.use(authenticateToken);
router.use(requireAdmin);

router.get("/dashboard", AdminController.getDashboardStats);
router.get("/users", AdminController.getUsers);

router.get("/users/:userId", AdminController.getUserDetails);
router.put("/users/:userId", AdminController.updateUser)

router.delete("/users/:userId", AdminController.deleteUser);

// Getting analytics
router.get("/analytics", AdminController.getAnalytics);

module.exports = router;