const mongoose = require("mongoose");

const CashShiftSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    cashierName: { type: String, required: true },
    cashierId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    openingFloat: { type: Number, required: true, default: 0 },
    expectedCash: { type: Number, default: 0 },
    actualCash: { type: Number },
    variance: { type: Number },
    payIns: [
      {
        amount: Number,
        reason: String,
        time: { type: Date, default: Date.now },
      },
    ],
    payOuts: [
      {
        amount: Number,
        reason: String,
        time: { type: Date, default: Date.now },
      },
    ],
    totalCard: { type: Number, default: 0 },
    totalUpi: { type: Number, default: 0 },
    totalCash: { type: Number, default: 0 },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CashShift", CashShiftSchema);
