const mongoose = require("mongoose");

const STATUSES = ["confirmed", "seated", "completed", "cancelled", "no-show"];
const SOURCES = ["walk-in", "phone", "online", "widget"];

const reservationSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    guestName: { type: String, required: true, trim: true },
    guestEmail: { type: String, default: "", trim: true },
    guestPhone: { type: String, default: "", required: true, trim: true },
    partySize: { type: Number, required: true, min: 1, max: 50 },
    date: { type: String, required: true },
    time: { type: String, required: true },
    duration: { type: Number, default: 90 },
    tableId: { type: String, default: null },
    status: {
      type: String,
      enum: STATUSES,
      default: "confirmed",
    },
    notes: { type: String, default: "" },
    source: {
      type: String,
      enum: SOURCES,
      default: "phone",
    },
    bookingSource: { type: String, default: null },
    floor: { type: String, default: null },
    subsection: { type: String, default: null },
    tableNumber: { type: String, default: null },
    specialOccasion: { type: String, default: null },
    smokingPreference: {
      type: String,
      enum: ["smoking", "non-smoking"],
      default: "non-smoking",
    },
    reminder_sent: { type: Boolean, default: false },
    confirmedAt: { type: Date, default: null },
    seatedAt: { type: Date, default: null },
    paymentVerification: {
      status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      extractedAmount: { type: String, default: null },
      extractedTransactionId: { type: String, default: null },
      extractedTimestamp: { type: String, default: null },
      extractedPaymentMethod: { type: String, default: null },
      screenshotUrl: { type: String, default: null },
      verifiedAt: { type: Date, default: null },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Reservation", reservationSchema);
module.exports.STATUSES = STATUSES;
module.exports.SOURCES = SOURCES;
