const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");
const { sendError } = require("../utils/response");
const HTTP_STATUS = require("../constants/httpStatus");
const { AUTH_MESSAGES } = require("../constants/messages");

/**
 * Middleware: verifies JWT and attaches user to req.
 * Use on routes that require the user to be logged in.
 */
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return sendError(res, {
      message: AUTH_MESSAGES.NOT_AUTHORIZED,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return sendError(res, {
        message: AUTH_MESSAGES.USER_NOT_FOUND,
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return sendError(res, {
      message: AUTH_MESSAGES.INVALID_OR_EXPIRED_TOKEN,
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }
};

module.exports = { requireAuth };
