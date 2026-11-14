const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const { sendSuccess, sendError } = require("../utils/response");
const { sendInviteEmail } = require("../utils/email");
const HTTP_STATUS = require("../constants/httpStatus");

/**
 * List staff. Admin: all. Manager: only users in same restaurant.
 * GET /api/staff
 */
const listStaff = async (req, res) => {
  const query = {};
  if (req.user.role === "manager" && req.user.restaurantId) {
    query.restaurantId = req.user.restaurantId;
  }
  const users = await User.find(query)
    .select("-password -otpCode -otpExpiresAt")
    .sort({ createdAt: -1 });
  const staff = users.map((u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    status: u.status,
    role: u.role,
    restaurantId: u.restaurantId,
  }));
  return sendSuccess(res, { data: { staff } });
};

/**
 * Create staff. Manager: restaurantName required, creates/finds restaurant.
 * Waiter: restaurantId required. Admin: manager needs restaurantName, waiter needs restaurantId.
 * POST /api/staff
 * Body: { name, email, phone?, role, restaurantName? (for manager), restaurantId? (for waiter) }
 */
const createStaff = async (req, res) => {
  const { name, email, phone, role, restaurantName, restaurantId, password } =
    req.body;

  if (!name || !email || !role || !password) {
    return sendError(res, {
      message: "Name, email, role, and password are required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  if (!["manager", "waiter"].includes(role)) {
    return sendError(res, {
      message: "Role must be manager or waiter",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  let targetRestaurantId = null;
  if (role === "manager") {
    if (req.user.role === "manager") {
      return sendError(res, {
        message: "Managers cannot create other managers",
        statusCode: HTTP_STATUS.FORBIDDEN,
      });
    } else {
      // Admin adding manager: can send restaurantId (assign to existing restaurant) or restaurantName (create/find)
      if (restaurantId) {
        const rest = await Restaurant.findById(restaurantId);
        if (!rest) {
          return sendError(res, {
            message: "Restaurant not found",
            statusCode: HTTP_STATUS.BAD_REQUEST,
          });
        }
        targetRestaurantId = rest._id;
      } else {
        const rn = (restaurantName || "").trim();
        if (!rn) {
          return sendError(res, {
            message: "Restaurant name is required when adding a manager",
            statusCode: HTTP_STATUS.BAD_REQUEST,
          });
        }
        let rest = await Restaurant.findOne({
          name: { $regex: new RegExp(`^${rn}$`, "i") },
        });
        if (!rest) rest = await Restaurant.create({ name: rn });
        targetRestaurantId = rest._id;
      }
    }
  } else {
    if (!restaurantId) {
      return sendError(res, {
        message: "Please select a restaurant for the waiter",
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }
    const rest = await Restaurant.findById(restaurantId);
    if (!rest) {
      return sendError(res, {
        message: "Restaurant not found",
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }
    targetRestaurantId = rest._id;
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return sendError(res, {
      message: "A staff member with this email already exists",
      statusCode: HTTP_STATUS.CONFLICT,
    });
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: phone?.trim() || null,
    role,
    status: "active",
    restaurantId: targetRestaurantId,
    password,
  });

  await sendInviteEmail(user.email, user.name, user.role).catch((err) => {
    console.warn("Invite email failed (non-fatal):", err.message);
  });

  return sendSuccess(res, {
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    },
    message: `${user.name} added as ${role}`,
    statusCode: HTTP_STATUS.CREATED,
  });
};

function getStaffQuery(req) {
  const query = {};
  if (req.user.role === "manager" && req.user.restaurantId) {
    query.restaurantId = req.user.restaurantId;
  }
  return query;
}

/**
 * Update staff. Manager can only update staff in their restaurant.
 * PATCH /api/staff/:id
 * Body: { name?, email?, phone? }
 */
const updateStaff = async (req, res) => {
  const baseQuery = { _id: req.params.id };
  const scopeQuery = getStaffQuery(req);
  const query =
    req.user.role === "admin" ? baseQuery : { ...baseQuery, ...scopeQuery };
  const user = await User.findOne(query);
  if (!user) {
    return sendError(res, {
      message: "Staff member not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }
  if (req.body.name !== undefined) {
    user.name = String(req.body.name).trim() || user.name;
  }
  if (req.body.phone !== undefined) {
    user.phone =
      req.body.phone != null && String(req.body.phone).trim() !== ""
        ? String(req.body.phone).trim()
        : null;
  }
  if (req.body.email !== undefined) {
    const newEmail = String(req.body.email).toLowerCase().trim();
    if (!newEmail) {
      return sendError(res, {
        message: "Email is required",
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }
    const existing = await User.findOne({
      email: newEmail,
      _id: { $ne: user._id },
    });
    if (existing) {
      return sendError(res, {
        message: "A staff member with this email already exists",
        statusCode: HTTP_STATUS.CONFLICT,
      });
    }
    user.email = newEmail;
  }
  await user.save();
  const u = user.toObject();
  return sendSuccess(res, {
    data: {
      user: {
        id: u._id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        status: u.status,
        role: u.role,
        restaurantId: u.restaurantId,
      },
    },
    message: "Staff updated",
  });
};

/**
 * Delete staff. Manager can only delete staff in their restaurant.
 * DELETE /api/staff/:id
 */
const deleteStaff = async (req, res) => {
  const baseQuery = { _id: req.params.id };
  const scopeQuery = getStaffQuery(req);
  const query =
    req.user.role === "admin" ? baseQuery : { ...baseQuery, ...scopeQuery };
  const user = await User.findOne(query);
  if (!user) {
    return sendError(res, {
      message: "Staff member not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }
  await User.findByIdAndDelete(user._id);
  return sendSuccess(res, { message: "Staff member deleted" });
};

module.exports = { listStaff, createStaff, updateStaff, deleteStaff };
