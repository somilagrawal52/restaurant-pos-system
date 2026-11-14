const Order = require("../models/Order");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/response");

// GET /api/orders
exports.getOrders = asyncHandler(async (req, res) => {
  const { status, type } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, { data: { orders } });
});

// GET /api/orders/:id
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return sendError(res, "Order not found", 404);
  return sendSuccess(res, { data: { order } });
});

// POST /api/orders
exports.createOrder = asyncHandler(async (req, res) => {
  const count = await Order.countDocuments();
  const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 101).padStart(4, "0")}`;

  const orderData = {
    ...req.body,
    orderNumber,
    serverId: req.user?._id,
    serverName: req.user?.name || req.body.serverName || "Staff",
  };

  const order = await Order.create(orderData);
  return sendSuccess(res, { message: "Order created successfully", data: { order } }, 201);
});

// PATCH /api/orders/:id/status
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status, updatedAt: new Date() },
    { new: true }
  );
  if (!order) return sendError(res, "Order not found", 404);
  return sendSuccess(res, { message: "Order status updated", data: { order } });
});

// POST /api/orders/:id/payments
exports.recordPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return sendError(res, "Order not found", 404);

  const { method, amount, tendered, change, referenceNumber } = req.body;
  order.payments.push({
    method,
    amount,
    tendered,
    change,
    referenceNumber,
    transactionTime: new Date(),
  });

  order.paidAmount = (order.paidAmount || 0) + Number(amount);
  if (order.paidAmount >= order.totalAmount) {
    order.status = "paid";
  }

  await order.save();
  return sendSuccess(res, { message: "Payment recorded", data: { order } });
});
