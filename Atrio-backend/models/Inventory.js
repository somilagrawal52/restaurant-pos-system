const mongoose = require("mongoose");

const RecipeIngredientSchema = new mongoose.Schema({
  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem",
  },
  ingredientName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
});

const InventoryItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["produce", "dairy", "meat", "beverage", "bakery", "spices"],
      required: true,
    },
    currentStock: { type: Number, required: true, default: 0 },
    unit: {
      type: String,
      enum: ["kg", "g", "liters", "ml", "pieces", "packs"],
      required: true,
    },
    reorderLevel: { type: Number, required: true, default: 10 },
    costPerUnit: { type: Number, required: true, default: 0 },
    supplier: { type: String },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const RecipeBOMSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    menuItemName: { type: String, required: true },
    ingredients: [RecipeIngredientSchema],
  },
  { timestamps: true }
);

module.exports = {
  InventoryItem: mongoose.model("InventoryItem", InventoryItemSchema),
  RecipeBOM: mongoose.model("RecipeBOM", RecipeBOMSchema),
};
