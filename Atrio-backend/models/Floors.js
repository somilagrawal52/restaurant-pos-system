const mongoose = require("mongoose");

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const tableSectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    from: { type: Number, required: true, min: 1 },
    to: { type: Number, required: true, min: 1 },
    seats: { type: Number, required: true, min: 1 },
    smokingPreference: {
      type: String,
      enum: ["smoking", "non-smoking"],
      default: "non-smoking",
    },
    tableSeats: { type: Map, of: Number, default: {} },
    tableWeights: { type: Map, of: Number, default: {} },
  },
  { _id: true },
);

const tableStatusSchema = new mongoose.Schema(
  {
    tableNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "cleaning"],
      default: "available",
    },
  },
  { _id: false },
);

const sectionStatusSchema = new mongoose.Schema(
  {
    sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    statuses: { type: [tableStatusSchema], default: [] },
  },
  { _id: false },
);

// ─── Main schema ──────────────────────────────────────────────────────────────

const floorSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },
    floorNumber: { type: Number, required: true, min: 1 },
    name: { type: String, required: true, trim: true },
    sections: { type: [tableSectionSchema], default: [] },
    sectionStatuses: { type: [sectionStatusSchema], default: [] },
  },
  { timestamps: true },
);

// Ensure unique floor numbers per restaurant
floorSchema.index({ restaurantId: 1, floorNumber: 1 }, { unique: true });

module.exports = mongoose.model("Floor", floorSchema);
