/**
 * Standard API response helpers.
 * Ensures consistent response shape across all endpoints.
 */

const sendSuccess = (res, { data = null, message = "Success", statusCode = 200 }) => {
  const payload = {
    success: true,
    message,
    ...(data !== null && { data }),
  };
  return res.status(statusCode).json(payload);
};

const sendError = (res, { message = "An error occurred", statusCode = 500 }) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
