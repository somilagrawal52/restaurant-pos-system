require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");
const ocrRoutes = require("./routes/ocr");
const authRoutes = require("./routes/auth");
const setupRoutes = require("./routes/setup");
const staffRoutes = require("./routes/staff");
const floorRoutes = require("./routes/floor");
const reservationRoutes = require("./routes/reservations");
const restaurantRoutes = require("./routes/restaurants");
const customerRoutes = require("./routes/customers");
const floorCategoryRoutes = require("./routes/floorCategories");
const transcriptionRoutes = require("./routes/transcription");

// POS Enterprise Module Routes
const orderRoutes = require("./routes/orders");
const menuRoutes = require("./routes/menu");
const inventoryRoutes = require("./routes/inventory");
const shiftRoutes = require("./routes/shifts");

const { requireAuth } = require("./middleware/auth");
const errorHandler = require("./middleware/errorHandler");
const asyncHandler = require("./utils/asyncHandler");
const { sendSuccess } = require("./utils/response");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@aurapos.io";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin@123";

const app = express();
const PORT = process.env.PORT || 8080;

const isVercel = process.env.VERCEL === "1";

connectDB();

if (!isVercel) {
  require("./Workers/reminderWorker");
}

// Ensure default admin exists (admin@aurapos.io / admin@123)
mongoose.connection.once("open", async () => {
  try {
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (!existing) {
      await User.create({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: "Admin",
        role: "admin",
        status: "active",
      });
      console.log("Admin user created:", ADMIN_EMAIL);
    }
  } catch (err) {
    console.error("Seed admin failed:", err.message);
  }
});

app.use(express.json());

// CORS – allow all origins
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get("/", (req, res) => {
  res.json({
    name: "AuraPOS API",
    status: "running",
    version: "2.4.0",
    docs: "/api-docs",
  });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/setup", setupRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/floor-categories", floorCategoryRoutes);
app.use("/api/floors", floorRoutes);
app.use("/api/transcription", transcriptionRoutes);

// POS Core Endpoints
app.use("/api/orders", orderRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/shifts", shiftRoutes);

// Protected healthcheck
app.get(
  "/protected",
  requireAuth,
  asyncHandler(async (req, res) => {
    return sendSuccess(res, {
      message: "You are logged in.",
      data: { user: req.user },
    });
  })
);

app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`AuraPOS Server running on port ${PORT}`);
  });
}

module.exports = app;
