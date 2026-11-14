const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["admin", "manager", "waiter"];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      minlength: 6,
      select: false,
    },
    name: { type: String, default: "" },
    phone: { type: String, default: null },
    role: {
      type: String,
      enum: ROLES,
      default: "waiter",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },
    otpCode: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
