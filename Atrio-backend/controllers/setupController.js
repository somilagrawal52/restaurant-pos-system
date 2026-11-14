const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const { sendSuccess, sendError } = require("../utils/response");
const HTTP_STATUS = require("../constants/httpStatus");

/**
 * Create first manager via /setup. Requires restaurant name.
 * POST /api/setup/admin
 * Body: { name, email, phone?, restaurantName }
 */
const setupAdmin = async (req, res) => {
  const { name, email, phone, restaurantName } = req.body;

  if (!name || !email) {
    return sendError(res, {
      message: "Name and email are required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  const rn = (restaurantName || "").trim();
  if (!rn) {
    return sendError(res, {
      message: "Restaurant name is required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const existingCount = await User.countDocuments();
  if (existingCount > 0) {
    return sendError(res, {
      message: "Setup already completed. Use login instead.",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return sendError(res, {
      message: "An account with this email already exists",
      statusCode: HTTP_STATUS.CONFLICT,
    });
  }

  let restaurant = await Restaurant.findOne({ name: { $regex: new RegExp(`^${rn}$`, "i") } });
  if (!restaurant) restaurant = await Restaurant.create({ name: rn });

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || null,
    role: "manager",
    status: "active",
    restaurantId: restaurant._id,
  });

  return sendSuccess(res, {
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
    message: "Manager account created. You can now log in.",
    statusCode: HTTP_STATUS.CREATED,
  });
};

module.exports = { setupAdmin };
