/**
 * Ensures the default admin user exists: admin@aurapos.io / admin@123
 * Run once or call from app after DB connect.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@aurapos.io";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@123";

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log("Admin user already exists:", ADMIN_EMAIL);
      process.exit(0);
      return;
    }
    await User.create({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: "Admin",
      role: "admin",
      status: "active",
    });
    console.log("Admin user created:", ADMIN_EMAIL);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
