const CashShift = require("../models/Shift");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/response");

// GET /api/shifts/current
exports.getCurrentShift = asyncHandler(async (req, res) => {
  const shift = await CashShift.findOne({ status: "open" }).sort({ createdAt: -1 });
  return sendSuccess(res, { data: { shift } });
});

// POST /api/shifts/open
exports.openShift = asyncHandler(async (req, res) => {
  const existing = await CashShift.findOne({ status: "open" });
  if (existing) return sendError(res, "A shift is already open on this terminal", 400);

  const { openingFloat } = req.body;
  const shift = await CashShift.create({
    cashierName: req.user?.name || "Staff Cashier",
    cashierId: req.user?._id,
    openingFloat: Number(openingFloat) || 0,
    expectedCash: Number(openingFloat) || 0,
    status: "open",
  });

  return sendSuccess(res, { message: "Shift opened", data: { shift } }, 201);
});

// POST /api/shifts/:id/pay-in
exports.recordPayIn = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  const shift = await CashShift.findById(req.params.id);
  if (!shift || shift.status !== "open") return sendError(res, "Active shift not found", 404);

  shift.payIns.push({ amount: Number(amount), reason, time: new Date() });
  shift.expectedCash = (shift.expectedCash || 0) + Number(amount);
  await shift.save();

  return sendSuccess(res, { message: "Pay-in recorded", data: { shift } });
});

// POST /api/shifts/:id/pay-out
exports.recordPayOut = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  const shift = await CashShift.findById(req.params.id);
  if (!shift || shift.status !== "open") return sendError(res, "Active shift not found", 404);

  shift.payOuts.push({ amount: Number(amount), reason, time: new Date() });
  shift.expectedCash = (shift.expectedCash || 0) - Number(amount);
  await shift.save();

  return sendSuccess(res, { message: "Pay-out recorded", data: { shift } });
});

// POST /api/shifts/:id/close
exports.closeShift = asyncHandler(async (req, res) => {
  const { actualCash } = req.body;
  const shift = await CashShift.findById(req.params.id);
  if (!shift || shift.status !== "open") return sendError(res, "Active shift not found", 404);

  const counted = Number(actualCash) || 0;
  shift.actualCash = counted;
  shift.variance = counted - shift.expectedCash;
  shift.status = "closed";
  shift.closedAt = new Date();
  await shift.save();

  return sendSuccess(res, { message: "Shift closed & Z-Report ready", data: { shift } });
});
