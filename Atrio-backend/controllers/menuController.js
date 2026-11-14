const MenuItem = require("../models/MenuItem");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/response");

// GET /api/menu
exports.getMenuItems = asyncHandler(async (req, res) => {
  const { categoryId, station, availableOnly } = req.query;
  const filter = {};
  if (categoryId) filter.categoryId = categoryId;
  if (station) filter.station = station;
  if (availableOnly === "true") filter.isAvailable = true;

  const items = await MenuItem.find(filter).sort({ categoryName: 1, name: 1 });
  return sendSuccess(res, { data: { items } });
});

// POST /api/menu
exports.createMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.create(req.body);
  return sendSuccess(res, { message: "Item created", data: { item } }, 201);
});

// PATCH /api/menu/:id
exports.updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) return sendError(res, "Item not found", 404);
  return sendSuccess(res, { message: "Item updated", data: { item } });
});

// PATCH /api/menu/:id/toggle-86
exports.toggle86 = asyncHandler(async (req, res) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) return sendError(res, "Item not found", 404);

  item.isAvailable = !item.isAvailable;
  await item.save();
  return sendSuccess(res, {
    message: `Item marked as ${item.isAvailable ? "Available" : "86ed"}`,
    data: { item },
  });
});
