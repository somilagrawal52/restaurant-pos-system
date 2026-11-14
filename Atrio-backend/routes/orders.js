const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, orderController.getOrders);
router.get("/:id", requireAuth, orderController.getOrderById);
router.post("/", requireAuth, orderController.createOrder);
router.patch("/:id/status", requireAuth, orderController.updateOrderStatus);
router.post("/:id/payments", requireAuth, orderController.recordPayment);

module.exports = router;
