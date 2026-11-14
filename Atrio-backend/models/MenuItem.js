const mongoose = require("mongoose");

const ModifierOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
});

const ModifierGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  required: { type: Boolean, default: false },
  minSelect: { type: Number, default: 0 },
  maxSelect: { type: Number, default: 1 },
  options: [ModifierOptionSchema],
});

const MenuItemVariantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const MenuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    name: { type: String, required: true },
    description: { type: String },
    categoryId: { type: String, required: true },
    categoryName: { type: String, required: true },
    basePrice: { type: Number, required: true },
    image: { type: String },
    dietary: {
      type: String,
      enum: ["veg", "non_veg", "vegan", "gluten_free"],
      default: "veg",
    },
    station: {
      type: String,
      enum: ["kitchen", "bar", "grill", "pantry", "dessert"],
      default: "kitchen",
    },
    variants: [MenuItemVariantSchema],
    modifierGroups: [ModifierGroupSchema],
    isAvailable: { type: Boolean, default: true },
    preparationTimeMinutes: { type: Number, default: 10 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenuItem", MenuItemSchema);
