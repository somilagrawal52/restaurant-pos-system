const { InventoryItem, RecipeBOM } = require("../models/Inventory");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendError } = require("../utils/response");

// GET /api/inventory
exports.getInventory = asyncHandler(async (req, res) => {
  const items = await InventoryItem.find().sort({ category: 1, name: 1 });
  return sendSuccess(res, { data: { items } });
});

// POST /api/inventory
exports.createInventoryItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.create(req.body);
  return sendSuccess(res, { message: "Inventory item created", data: { item } }, 201);
});

// PATCH /api/inventory/:id/stock
exports.updateStock = asyncHandler(async (req, res) => {
  const { delta } = req.body; // e.g. +10 or -2
  const item = await InventoryItem.findById(req.params.id);
  if (!item) return sendError(res, "Item not found", 404);

  item.currentStock = Math.max(0, item.currentStock + Number(delta));
  item.lastUpdated = new Date();
  await item.save();

  return sendSuccess(res, { message: "Stock updated", data: { item } });
});

// GET /api/inventory/boms
exports.getRecipeBOMs = asyncHandler(async (req, res) => {
  const boms = await RecipeBOM.find();
  return sendSuccess(res, { data: { boms } });
});

// POST /api/inventory/boms
exports.createRecipeBOM = asyncHandler(async (req, res) => {
  const bom = await RecipeBOM.create(req.body);
  return sendSuccess(res, { message: "Recipe BOM created", data: { bom } }, 201);
});
