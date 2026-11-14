const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const Reservation = require("../models/Reservation");
const Floor = require("../models/Floors");
const FloorCategory = require("../models/FloorCategory");
const { sendSuccess, sendError } = require("../utils/response");
const HTTP_STATUS = require("../constants/httpStatus");

/**
 * List all restaurants (admin or for dropdowns).
 * GET /api/restaurants
 */
const list = async (req, res) => {
  const restaurants = await Restaurant.find({}).sort({ name: 1 }).lean();
  const data = restaurants.map((r) => ({
    id: r._id,
    name: r.name,
    address: r.address ?? null,
    seatingCapacity: r.seatingCapacity ?? null,
    noShowGraceMinutes: r.noShowGraceMinutes ?? 0,
  }));
  return sendSuccess(res, { data: { restaurants: data } });
};

/**
 * Create restaurant (admin).
 * POST /api/restaurants
 * Body: { name, address?, seatingCapacity? }
 */
const create = async (req, res) => {
  const { name, address, seatingCapacity } = req.body;
  if (!name || !String(name).trim()) {
    return sendError(res, {
      message: "Restaurant name is required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  const payload = {
    name: String(name).trim(),
    address: address != null && String(address).trim() !== "" ? String(address).trim() : null,
    seatingCapacity:
      seatingCapacity != null && seatingCapacity !== "" && !Number.isNaN(Number(seatingCapacity))
        ? Number(seatingCapacity)
        : null,
  };
  const existing = await Restaurant.findOne({
    name: { $regex: new RegExp(`^${payload.name}$`, "i") },
  });
  if (existing) {
    return sendSuccess(res, {
      data: {
        restaurant: {
          id: existing._id,
          name: existing.name,
          address: existing.address ?? null,
          seatingCapacity: existing.seatingCapacity ?? null,
        },
      },
      message: "Restaurant already exists",
    });
  }
  const restaurant = await Restaurant.create(payload);
  return sendSuccess(res, {
    data: {
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        address: restaurant.address ?? null,
        seatingCapacity: restaurant.seatingCapacity ?? null,
        noShowGraceMinutes: restaurant.noShowGraceMinutes ?? 0,
      },
    },
    message: "Restaurant created",
    statusCode: HTTP_STATUS.CREATED,
  });
};

/**
 * Delete restaurant. Admin only.
 * Fails if any staff are assigned. Cascades to reservations, floors, floor categories.
 * DELETE /api/restaurants/:id
 */
const remove = async (req, res) => {
  const { id } = req.params;
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) {
    return sendError(res, {
      message: "Restaurant not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }

  const staffCount = await User.countDocuments({ restaurantId: id });
  if (staffCount > 0) {
    return sendError(res, {
      message: "Cannot delete restaurant: staff are assigned. Remove or reassign them first.",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }

  await Reservation.deleteMany({ restaurantId: id });
  await Floor.deleteMany({ restaurantId: id });
  await FloorCategory.deleteMany({ restaurantId: id });
  await Restaurant.findByIdAndDelete(id);

  return sendSuccess(res, { message: "Restaurant deleted" });
};

/**
 * Get one restaurant. Manager can only get their own; admin can get any.
 * GET /api/restaurants/:id
 */
const getOne = async (req, res) => {
  const { id } = req.params;
  const userRestaurantId = req.user.restaurantId ? String(req.user.restaurantId) : "";
  if (req.user.role === "manager" && userRestaurantId !== id) {
    return sendError(res, {
      message: "You can only view your own restaurant",
      statusCode: HTTP_STATUS.FORBIDDEN,
    });
  }
  const restaurant = await Restaurant.findById(id).lean();
  if (!restaurant) {
    return sendError(res, {
      message: "Restaurant not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }
  return sendSuccess(res, {
    data: {
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        address: restaurant.address ?? null,
        seatingCapacity: restaurant.seatingCapacity ?? null,
        noShowGraceMinutes: restaurant.noShowGraceMinutes ?? 0,
      },
    },
  });
};

/**
 * Update restaurant. Manager can only update their own; admin can update any.
 * PATCH /api/restaurants/:id
 * Body: { noShowGraceMinutes?, name?, address?, seatingCapacity? }
 */
const update = async (req, res) => {
  const { id } = req.params;
  const userRestaurantId = req.user.restaurantId ? String(req.user.restaurantId) : "";
  if (req.user.role === "manager" && userRestaurantId !== id) {
    return sendError(res, {
      message: "You can only update your own restaurant",
      statusCode: HTTP_STATUS.FORBIDDEN,
    });
  }
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) {
    return sendError(res, {
      message: "Restaurant not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }
  const { noShowGraceMinutes, name, address, seatingCapacity } = req.body;
  if (noShowGraceMinutes !== undefined) {
    const val = Number(noShowGraceMinutes);
    if (Number.isNaN(val) || val < 0) {
      return sendError(res, {
        message: "No-show grace minutes must be a non-negative number",
        statusCode: HTTP_STATUS.BAD_REQUEST,
      });
    }
    restaurant.noShowGraceMinutes = Math.min(999, Math.floor(val));
  }
  if (name !== undefined && String(name).trim()) restaurant.name = String(name).trim();
  if (address !== undefined) restaurant.address = address != null && String(address).trim() !== "" ? String(address).trim() : null;
  if (seatingCapacity !== undefined)
    restaurant.seatingCapacity =
      seatingCapacity != null && seatingCapacity !== "" && !Number.isNaN(Number(seatingCapacity)) ? Number(seatingCapacity) : null;
  await restaurant.save();
  return sendSuccess(res, {
    data: {
      restaurant: {
        id: restaurant._id,
        name: restaurant.name,
        address: restaurant.address ?? null,
        seatingCapacity: restaurant.seatingCapacity ?? null,
        noShowGraceMinutes: restaurant.noShowGraceMinutes ?? 0,
      },
    },
    message: "Restaurant updated",
  });
};

module.exports = { list, create, remove, getOne, update };
