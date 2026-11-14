const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
  menuItemId: { type: String, required: true },
  name: { type: String, required: true },
  basePrice: { type: Number, required: true },
  selectedVariant: {
    id: String,
    name: String,
    price: Number,
  },
  selectedModifiers: [
    {
      groupId: String,
      groupName: String,
      optionId: String,
      optionName: String,
      price: Number,
    },
  ],
  itemPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  totalPrice: { type: Number, required: true },
  notes: { type: String },
  station: {
    type: String,
    enum: ["kitchen", "bar", "grill", "pantry", "dessert"],
    default: "kitchen",
  },
  status: {
    type: String,
    enum: ["pending", "preparing", "ready", "served", "voided"],
    default: "pending",
  },
  firedAt: { type: Date },
});

const PaymentDetailsSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ["cash", "card", "upi_qr", "loyalty", "split"],
    required: true,
  },
  amount: { type: Number, required: true },
  tendered: { type: Number },
  change: { type: Number },
  referenceNumber: { type: String },
  transactionTime: { type: Date, default: Date.now },
});

const OrderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
    orderNumber: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["dine_in", "takeaway", "delivery", "bar_tab"],
      default: "dine_in",
    },
    tableId: { type: String },
    tableNumber: { type: Number },
    customerName: { type: String },
    customerPhone: { type: String },
    serverName: { type: String, default: "Staff" },
    serverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: [
        "draft",
        "sent_to_kitchen",
        "in_prep",
        "ready",
        "served",
        "billed",
        "paid",
        "cancelled",
      ],
      default: "draft",
    },
    items: [OrderItemSchema],
    subtotal: { type: Number, default: 0 },
    discountType: { type: String, enum: ["percent", "fixed"] },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    tipAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    payments: [PaymentDetailsSchema],
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
