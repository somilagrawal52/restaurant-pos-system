const { sendError } = require("../utils/response");
const HTTP_STATUS = require("../constants/httpStatus");

/**
 * Require the authenticated user to have one of the given roles.
 * Use after requireAuth.
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return sendError(res, {
      message: "Not authorized",
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }
  const role = req.user.role;
  if (!role || !allowedRoles.includes(role)) {
    return sendError(res, {
      message: "You do not have permission for this action",
      statusCode: HTTP_STATUS.FORBIDDEN,
    });
  }
  next();
};

module.exports = { requireRole };
