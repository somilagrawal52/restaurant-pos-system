/**
 * Wraps async route handlers to forward errors to the global error middleware.
 * Avoids try/catch in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
