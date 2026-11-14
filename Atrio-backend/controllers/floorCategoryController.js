const FloorCategory = require("../models/FloorCategory");
const { sendSuccess, sendError } = require("../utils/response");
const HTTP_STATUS = require("../constants/httpStatus");

const DEFAULT_SECTIONS = ["AC", "NON AC", "TERRACE", "PRIVATE"];

function getRestaurantId(req) {
  if (req.user.role === "admin") return req.query.restaurantId || req.body.restaurantId;
  return req.user.restaurantId;
}

/**
 * List sections: default + custom for restaurant.
 * GET /api/floor-categories?restaurantId= (admin)
 */
const list = async (req, res) => {
  const restaurantId = getRestaurantId(req);
  if (!restaurantId) {
    return sendError(res, {
      message: "Restaurant context required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  const custom = await FloorCategory.find({ restaurantId }).sort({ order: 1, name: 1 }).lean();
  const categories = [
    ...DEFAULT_SECTIONS.map((name, i) => ({ id: `default-${name}`, name, order: i, isDefault: true })),
    ...custom.map((c) => ({ id: c._id, name: c.name, order: c.order, isDefault: false })),
  ];
  return sendSuccess(res, { data: { categories } });
};

/**
 * Create custom category.
 * POST /api/floor-categories
 */
const create = async (req, res) => {
  const restaurantId = getRestaurantId(req);
  if (!restaurantId) {
    return sendError(res, {
      message: "Restaurant context required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  const { name } = req.body;
  if (!name || !String(name).trim()) {
    return sendError(res, {
      message: "Category name is required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  const count = await FloorCategory.countDocuments({ restaurantId });
  const category = await FloorCategory.create({
    restaurantId,
    name: String(name).trim(),
    order: count,
  });
  return sendSuccess(res, {
    data: { category: { id: category._id, name: category.name, order: category.order, isDefault: false } },
    statusCode: HTTP_STATUS.CREATED,
  });
};

/**
 * Update custom category. PATCH /api/floor-categories/:id
 */
const update = async (req, res) => {
  const restaurantId = getRestaurantId(req);
  if (!restaurantId) {
    return sendError(res, {
      message: "Restaurant context required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  if (String(req.params.id).startsWith("default-")) {
    return sendError(res, {
      message: "Default categories cannot be edited",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  const category = await FloorCategory.findOne({ _id: req.params.id, restaurantId });
  if (!category) {
    return sendError(res, {
      message: "Category not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }
  if (req.body.name !== undefined) category.name = String(req.body.name).trim();
  if (req.body.order !== undefined) category.order = Number(req.body.order);
  await category.save();
  return sendSuccess(res, {
    data: { category: { id: category._id, name: category.name, order: category.order, isDefault: false } },
  });
};

/**
 * Delete custom category. DELETE /api/floor-categories/:id
 */
const remove = async (req, res) => {
  const restaurantId = getRestaurantId(req);
  if (!restaurantId) {
    return sendError(res, {
      message: "Restaurant context required",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  if (String(req.params.id).startsWith("default-")) {
    return sendError(res, {
      message: "Default categories cannot be deleted",
      statusCode: HTTP_STATUS.BAD_REQUEST,
    });
  }
  const result = await FloorCategory.findOneAndDelete({ _id: req.params.id, restaurantId });
  if (!result) {
    return sendError(res, {
      message: "Category not found",
      statusCode: HTTP_STATUS.NOT_FOUND,
    });
  }
  return sendSuccess(res, { message: "Category deleted" });
};

module.exports = { list, create, update, remove };
