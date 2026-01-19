const express = require("express");
const router = express.Router();
const {
  addToCart,
  getUserCart,
  updateQuantity,
  removeFromCart
} = require("../controllers/cartController");

const verifyToken = require("../middleware/authMiddleware");

router.post("/add", verifyToken, addToCart);
router.get("/", verifyToken, getUserCart); 
router.put("/update/:itemId", verifyToken, updateQuantity);
router.delete("/remove/:itemId", verifyToken, removeFromCart);

module.exports = router;
