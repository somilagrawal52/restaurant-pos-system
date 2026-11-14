const { sendError } = require("../utils/response");
const HTTP_STATUS = require("../constants/httpStatus");
const { GENERAL_MESSAGES } = require("../constants/messages");

/**
 * Global error handler middleware.
 * Handles validation errors, JWT errors, and generic server errors.
 */
const errorHandler = (err, req, res, next) => {
  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = err.message || GENERAL_MESSAGES.VALIDATION_FAILED;
    return sendError(res, { message, statusCode: HTTP_STATUS.BAD_REQUEST });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return sendError(res, {
      message: "Invalid or expired token. Please log in again.",
      statusCode: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  // Mongoose duplicate key (e.g. unique email)
  if (err.code === 11000) {
    return sendError(res, {
      message: "An account with this email already exists.",
      statusCode: HTTP_STATUS.CONFLICT,
    });
  }

  // Default: log and return generic server error
  console.error("Error:", err);
  return sendError(res, {
    message: process.env.NODE_ENV === "production" ? GENERAL_MESSAGES.SERVER_ERROR : err.message,
    statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
};

module.exports = errorHandler;
