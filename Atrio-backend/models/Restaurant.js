const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    seatingCapacity: {
      type: Number,
      min: 1,
      default: null,
    },
    /** Minutes after reservation time before auto-marking as no-show. 0 = at reservation time. */
    noShowGraceMinutes: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
