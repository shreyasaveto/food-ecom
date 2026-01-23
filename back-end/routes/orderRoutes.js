const express = require("express");
const router = express.Router();
const {
  checkoutOrder,
  getOrderHistory,
  getAllOrders
} = require("../controllers/orderController");

const verifyToken = require("../middleware/authMiddleware");

router.post("/checkout", verifyToken, checkoutOrder);
router.get("/history", verifyToken, getOrderHistory);
router.get("/admin", verifyToken, getAllOrders);

module.exports = router;
